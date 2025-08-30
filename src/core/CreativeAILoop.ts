import { Context, Effect, Layer, Console } from "effect"
import { OpenAIService, type ExpertInteraction } from "../services/OpenAIService"
import { CLIService } from "../services/CLIService"
import { FileService } from "../services/FileService"
import { MemoryService } from "../services/MemoryService"
import { ExpertRegistry } from "./ExpertRegistry"
import chalk from "chalk"

export interface TaskContext {
  task: string
  outputType: string
  constraints: Record<string, any>
  preferences: Record<string, any>
  inspirationSeeds: any[]
}

export interface Philosophy {
  historicalGrounding?: string
  emotionalResonance?: string
  technicalBridge?: string
}

export interface TechnicalSpec {
  name: string
  description: string
  implementation: string
  setupCommands?: string[]
  criticalNotes?: string[]
}

export interface LoopResult {
  outputPath: string
  philosophy: Philosophy
  spec: TechnicalSpec
  expertInteractions: ExpertInteraction[]
}

export class CreativeAILoop extends Context.Tag("CreativeAILoop")<
  CreativeAILoop,
  {
    run: (initialPrompt: string) => Effect.Effect<LoopResult, Error>
  }
>() {
  static Live = Layer.effect(
    CreativeAILoop,
    Effect.gen(function*() {
      const openai = yield* OpenAIService
      const memory = yield* MemoryService
      const cli = yield* CLIService
      const files = yield* FileService
      const experts = new ExpertRegistry()

      return {
        run: (initialPrompt: string) =>
          Effect.gen(function*() {
            // Phase 0: Interactive Task Analysis
            const taskContext = yield* interactiveTaskAnalysis(
              initialPrompt,
              cli,
              memory
            )

            // Phase 1: Deep Conceptual Development
            yield* Console.log(chalk.cyan("\n🧠 Starting expert collaboration..."))
            const philosophy = yield* developConcept(
              taskContext,
              openai,
              experts,
              cli,
              memory
            )

            // Phase 2: Technical Specification
            yield* Console.log(chalk.cyan("\n⚙️  Translating to technical specification..."))
            const spec = yield* translateToSpec(
              philosophy,
              taskContext,
              openai,
              experts
            )

            // Phase 3: Generate Output
            yield* Console.log(chalk.cyan("\n📝 Generating Claude Code instructions..."))
            const outputPath = yield* formatOutput(
              philosophy,
              spec,
              taskContext,
              openai,
              files
            )

            // Get expert interaction summary
            const expertInteractions = yield* openai.getExpertInteractions()

            // Store in memory for future use
            yield* memory.storeSuccess(taskContext.task, philosophy, spec)

            // Display expert summary
            yield* displayExpertSummary(expertInteractions)

            return { outputPath, philosophy, spec, expertInteractions }
          })
      }
    })
  )
}

function interactiveTaskAnalysis(
  initialPrompt: string,
  cli: CLIService.Service,
  memory: MemoryService.Service
) {
  return Effect.gen(function*() {
    // Generate clarifying questions based on the task
    const questions = generateClarifyingQuestions(initialPrompt)

    // Ask questions interactively
    const responses = yield* cli.askQuestions(questions)

    // Find relevant past successes
    const inspirationSeeds = yield* memory.findRelevantSuccesses(initialPrompt)

    // Infer output type from task and responses
    const outputType = inferOutputType(initialPrompt, responses)

    return {
      task: initialPrompt,
      outputType,
      constraints: responses.constraints || {},
      preferences: responses.preferences || {},
      inspirationSeeds
    } as TaskContext
  })
}

function developConcept(
  context: TaskContext,
  openai: OpenAIService.Service,
  experts: ExpertRegistry,
  cli: CLIService.Service,
  memory: MemoryService.Service
) {
  return Effect.gen(function*() {
    const conceptualExperts = experts.selectConceptualExperts(context)

    const rounds = [
      { focus: "historical_grounding", lead: "DesignPhilosopher" },
      { focus: "emotional_resonance", lead: "ExperienceArchitect" },
      { focus: "technical_bridge", lead: "TechnicalPoet" }
    ]

    const philosophy: Philosophy = {}
    let previousResponseId: string | undefined

    for (const round of rounds) {
      // Generate expert discussion for this round
      const { systemPrompt, userPrompt } = experts.generateRoundPrompt(
        round,
        conceptualExperts,
        context,
        philosophy
      )

      yield* Console.log(chalk.blue(`  → ${round.lead} leading ${round.focus} discussion`))
      
      const response = yield* openai.generateResponse(
        userPrompt,
        {
          reasoningEffort: "high",
          verbosity: "medium"
        },
        previousResponseId
      )
      
      // Extract synthesis from the structured response
      const synthesis = extractSynthesis(response.content)
      philosophy[round.focus as keyof Philosophy] = synthesis
      previousResponseId = response.responseId
      
      // Track this expert interaction
      yield* openai.trackExpertInteraction({
        expertName: round.lead,
        round: round.focus,
        callCount: 1,
        insights: [synthesis],
        responseId: response.responseId
      })

      // Check if user wants to steer at key points
      if (shouldCheckWithUser(round)) {
        const feedback = yield* cli.getUserFeedback(
          round.focus,
          synthesis
        )
        if (feedback) {
          philosophy[round.focus as keyof Philosophy] = feedback
          // Track user intervention
          yield* openai.trackExpertInteraction({
            expertName: "User",
            round: round.focus,
            callCount: 1,
            insights: [feedback]
          })
        }
      }
    }

    return philosophy
  })
}

function translateToSpec(
  philosophy: Philosophy,
  context: TaskContext,
  openai: OpenAIService.Service,
  experts: ExpertRegistry
) {
  return Effect.gen(function*() {
    const technicalExperts = experts.selectTechnicalExperts(
      context.outputType,
      context.preferences
    )

    const { systemPrompt, userPrompt } = experts.generateTechnicalPrompt(
      philosophy,
      context,
      technicalExperts
    )

    yield* Console.log(chalk.blue(`  → Technical experts: ${technicalExperts.join(", ")}`))
    
    const response = yield* openai.generateResponse(
      userPrompt,
      {
        reasoningEffort: "high",
        verbosity: "high"  // More detailed for technical specs
      }
    )
    
    // Track technical expert interaction
    yield* openai.trackExpertInteraction({
      expertName: technicalExperts.join("+"),
      round: "technical_specification",
      callCount: 1,
      insights: [response.content]
    })

    // Parse the response into a structured spec
    const spec: TechnicalSpec = {
      name: context.task.split(" ").slice(0, 3).join("_"),
      description: context.task,
      implementation: response.content,
      setupCommands: [],
      criticalNotes: []
    }

    return spec
  })
}

function formatOutput(
  philosophy: Philosophy,
  spec: TechnicalSpec,
  context: TaskContext,
  openai: OpenAIService.Service,
  files: FileService.Service
) {
  return Effect.gen(function*() {
    // Generate final formatted output using GPT-5
    const systemPrompt = `You are a Claude Code Instruction Generator. You create comprehensive implementation guides that Claude Code can execute flawlessly.

<output_requirements>
- Generate markdown documents optimized for Claude Code execution
- Include clear step-by-step instructions
- Provide specific file paths, commands, and code examples
- Structure content for maximum actionability and clarity
- Include validation steps and testing guidance
</output_requirements>

<claude_code_optimization>
- Use specific file paths and directory structures
- Include exact command sequences (npm install, git commands, etc.)
- Provide complete code blocks, not just snippets
- Include error handling and troubleshooting steps
- Structure instructions sequentially for autonomous execution
</claude_code_optimization>`

    const userPrompt = `<task_context>
Task: ${context.task}
Output Type: ${context.outputType}
</task_context>

<design_philosophy>
${Object.entries(philosophy)
  .map(([key, value]) => `**${key.replace(/([A-Z])/g, ' $1').toLowerCase()}**: ${value}`)
  .join('\n\n')}
</design_philosophy>

<technical_specification>
${spec.implementation}
</technical_specification>

Generate a comprehensive Claude Code implementation guide with:
1. Project overview and setup
2. Design philosophy integration
3. Step-by-step implementation sequence
4. Specific code examples and file structures
5. Testing and validation procedures
6. Troubleshooting and optimization notes

Format as actionable markdown for immediate execution.`

    yield* Console.log(chalk.blue(`  → Generating Claude Code instructions`))
    
    const response = yield* openai.generateResponse(
      userPrompt,
      {
        reasoningEffort: "medium",  // Good balance for final output
        verbosity: "high"           // Detailed final instructions
      }
    )
    
    // Track final output generation
    yield* openai.trackExpertInteraction({
      expertName: "OutputGenerator",
      round: "claude_code_instructions",
      callCount: 1,
      insights: ["Generated final implementation guide"]
    })
    const outputPath = yield* files.saveOutput(context.task, response.content)

    return outputPath
  })
}

function generateClarifyingQuestions(task: string): string[] {
  const questions = []

  // Always ask about purpose
  questions.push("Is this for production, experimentation, or learning?")

  // Check for visual/UI tasks
  if (task.match(/ui|interface|design|app|website|frontend/i)) {
    questions.push("What emotional tone should this convey? (professional, playful, minimal, bold)")
  }

  // Check for data tasks
  if (task.match(/data|api|backend|database|process/i)) {
    questions.push("What scale of data will this handle? (small/personal, medium/team, large/enterprise)")
  }

  // Always offer tech stack choice
  questions.push("Preferred technology stack? (or type 'surprise me' for recommendation)")

  return questions
}

function inferOutputType(task: string, responses: any): string {
  if (task.match(/react|component|ui|frontend/i)) return "react_app"
  if (task.match(/cli|command|terminal|script/i)) return "cli_tool"
  if (task.match(/api|backend|server|service/i)) return "api_service"
  if (task.match(/config|settings|json|yaml/i)) return "configuration"
  return "general"
}

function shouldCheckWithUser(round: { focus: string }): boolean {
  return ["emotional_resonance", "technical_bridge"].includes(round.focus)
}

function extractSynthesis(content: string): string {
  // Extract the synthesis section from the structured response
  const synthesisMatch = content.match(/\*\*Synthesis\*\*:?\s*(.*?)(?=\n\n|\n\*\*|$)/s)
  if (synthesisMatch) {
    return synthesisMatch[1].trim()
  }
  
  // Fallback: look for synthesis section with different formatting
  const altSynthesisMatch = content.match(/(?:synthesis|final insight|conclusion):?\s*(.*?)(?=\n\n|\n\*\*|$)/si)
  if (altSynthesisMatch) {
    return altSynthesisMatch[1].trim()
  }
  
  // If no clear synthesis found, take the last substantial paragraph
  const paragraphs = content.split('\n\n').filter(p => p.trim().length > 50)
  return paragraphs[paragraphs.length - 1]?.trim() || content.trim()
}

function displayExpertSummary(interactions: ExpertInteraction[]) {
  return Effect.gen(function*() {
    yield* Console.log(chalk.green("\n📊 Expert Collaboration Summary:"))
    
    const totalCalls = interactions.reduce((sum, i) => sum + i.callCount, 0)
    yield* Console.log(chalk.gray(`Total GPT-5 calls: ${totalCalls}`))
    
    for (const interaction of interactions) {
      yield* Console.log(
        chalk.yellow(`\n  ${interaction.expertName}`) +
        chalk.gray(` (${interaction.round})`) +
        chalk.blue(` - ${interaction.callCount} call${interaction.callCount > 1 ? 's' : ''}`)
      )
      
      // Show key insights
      if (interaction.insights.length > 0) {
        const preview = interaction.insights[0].substring(0, 100) + "..."
        yield* Console.log(chalk.gray(`    ${preview}`))
      }
    }
    
    yield* Console.log(chalk.green("\n✨ All expert perspectives synthesized successfully!"))
  })
}
