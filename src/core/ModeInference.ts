import { Effect } from "effect"
import { OpenAIService } from "../services/OpenAIService"
import { DynamicAgentFactory, type DynamicAgent } from "./DynamicAgentFactory"

export type Mode = "pr" | "design_review" | "explore"

export interface Round {
  focus: string
  lead: string
  dynamicAgent?: DynamicAgent
}

export const baseRoundsByMode: Record<Mode, Round[]> = {
  pr: [
    { focus: "constraints", lead: "SpecScribe" },
    { focus: "architecture_plan", lead: "EffectArchitect" },
    { focus: "tests_first", lead: "TestEngineer" },
    { focus: "impl", lead: "CodeGen" },
    { focus: "consistency_gate", lead: "DXEnforcer" },
    { focus: "pr_summary", lead: "PRWriter" },
    { focus: "final_synthesis", lead: "MasterReviewer" }
  ],
  design_review: [
    { focus: "design_principles", lead: "DesignPhilosopher" },
    { focus: "architecture_plan", lead: "EffectArchitect" },
    { focus: "consistency_gate", lead: "DXEnforcer" },
    { focus: "final_optimization", lead: "MasterReviewer" }
  ],
  explore: [
    { focus: "concepts", lead: "DesignPhilosopher" },
    { focus: "experience_goals", lead: "ExperienceArchitect" },
    { focus: "technical_bridge", lead: "TechnicalPoet" },
    { focus: "creative_synthesis", lead: "MasterReviewer" }
  ]
}

/**
 * Fast rule-based mode inference as fallback
 */
function quickInferMode(task: string): Mode {
  const t = task.toLowerCase()
  
  if (/\b(explore|brainstorm|concept|history|aesthetic|theme|story|creative|innovative|vision)\b/.test(t)) {
    return "explore"
  }
  
  if (/\b(review|audit|consistency|refactor|check|validate|improve|optimize|analyze)\b/.test(t)) {
    return "design_review"
  }
  
  return "pr" // default for implementation tasks
}

/**
 * AI-powered mode inference using GPT-5 for nuanced understanding
 */
export function inferModeWithAI(task: string, openai: OpenAIService.Service): Effect.Effect<Mode, Error> {
  return Effect.gen(function* () {
    const systemPrompt = `You are a mode classifier for development tasks. Classify the task into exactly one mode:

<modes>
- "pr": Implementation, feature development, bug fixes, building something new
- "design_review": Reviewing, auditing, refactoring, improving existing systems  
- "explore": Brainstorming, conceptual exploration, creative ideation, research
</modes>

<classification_rules>
- Focus on the PRIMARY intent of the task
- "pr" = making/building/implementing something concrete
- "design_review" = evaluating/improving something that exists
- "explore" = open-ended discovery/concept development
</classification_rules>

Respond with ONLY the mode name: "pr", "design_review", or "explore"`

    const userPrompt = `Task: "${task}"

What mode is this? Respond with only the mode name.`

    // Combine system and user prompts into a single prompt
    const fullPrompt = `System: ${systemPrompt}

User: ${userPrompt}`

    try {
      const response = yield* openai.generateResponse(
        fullPrompt,
        {
          reasoningEffort: "low",  // Fast classification
          verbosity: "low"
        }
      )
      
      const mode = response.content.trim().toLowerCase().replace(/['"]/g, '')
      
      // Validate the response and fallback if needed
      if (mode === "pr" || mode === "design_review" || mode === "explore") {
        return mode as Mode
      } else {
        // Fallback to rule-based inference
        return quickInferMode(task)
      }
      
    } catch (error) {
      // Fallback to rule-based inference if AI fails
      return quickInferMode(task)
    }
  })
}

/**
 * Plan rounds based on inferred mode with dynamic agent creation
 */
export function planRounds(
  mode: Mode,
  task: string,
  agentFactory?: DynamicAgentFactory
): Effect.Effect<Round[], Error> {
  return Effect.gen(function* () {
    const baseRounds = baseRoundsByMode[mode]
    
    if (!agentFactory) {
      return baseRounds
    }

    // Analyze if we need additional dynamic agents
    const existingAgents = baseRounds.map(r => r.lead)
    const analysis = yield* agentFactory.analyzeAgentNeeds(task, existingAgents)
    
    if (!analysis.needed) {
      return baseRounds
    }

    // Create dynamic agents for missing capabilities
    const dynamicAgents = yield* agentFactory.findOrCreateAgents(
      task,
      analysis.suggestedDomains
    )

    // Create team collaboration strategy
    if (dynamicAgents.length > 0) {
      const team = yield* agentFactory.createAgentTeam(task, dynamicAgents)
      
      // Insert dynamic agent rounds based on collaboration strategy
      const enhancedRounds: Round[] = [...baseRounds]
      
      // Add dynamic agent rounds after initial analysis
      const insertIndex = mode === "explore" ? 1 : 2
      
      for (const agent of team.team) {
        enhancedRounds.splice(insertIndex, 0, {
          focus: `dynamic_${agent.domain}`,
          lead: agent.name,
          dynamicAgent: agent
        })
      }
      
      return enhancedRounds
    }
    
    return baseRounds
  })
}

/**
 * Plan rounds synchronously (backward compatibility)
 */
export function planRoundsSync(mode: Mode): Round[] {
  return baseRoundsByMode[mode]
}

/**
 * Get expert configuration including reasoning effort and specific instructions
 */
export function getExpertConfig(expertName: string, mode: Mode): {
  reasoningEffort: "low" | "medium" | "high"
  verbosity: "low" | "medium" | "high"
  instructions?: string
} {
  // MasterReviewer always uses high reasoning for deep synthesis
  if (expertName === "MasterReviewer") {
    return {
      reasoningEffort: "high",
      verbosity: "high",
      instructions: getMasterReviewerInstructions(mode)
    }
  }

  // DesignPhilosopher gets mode-specific instructions
  if (expertName === "DesignPhilosopher") {
    return {
      reasoningEffort: "medium",
      verbosity: "medium", 
      instructions: getDesignPhilosopherMode(mode)
    }
  }

  // Default configuration for other experts
  return {
    reasoningEffort: "medium",
    verbosity: "low"
  }
}

/**
 * Get mode-specific instructions for MasterReviewer
 */
function getMasterReviewerInstructions(mode: Mode): string {
  const baseInstructions = `You are conducting the final review and synthesis. Take deep time to think through all aspects.`
  
  switch (mode) {
    case "pr":
      return `${baseInstructions}

<pr_review_focus>
- Ensure implementation meets all constraints and requirements
- Verify architecture is sound and follows Effect patterns
- Confirm tests adequately cover the implementation
- Check for code quality, maintainability, and best practices  
- Validate the PR summary accurately represents the changes
- Identify any potential bugs, edge cases, or performance issues
- Ensure consistency with existing codebase patterns
</pr_review_focus>`

    case "design_review":
      return `${baseInstructions}

<design_optimization_focus>
- Synthesize design principles into a coherent design philosophy
- Ensure architectural decisions support long-term maintainability
- Identify opportunities for design improvements and optimizations
- Verify consistency across all design recommendations
- Check alignment with user needs and business goals
- Highlight any contradictions between expert recommendations
</design_optimization_focus>`

    case "explore":
      return `${baseInstructions}

<creative_synthesis_focus>  
- Weave together conceptual insights into an inspiring vision
- Ensure technical bridge maintains creative integrity
- Identify the most innovative and promising directions
- Synthesize experience goals with technical possibilities
- Highlight breakthrough opportunities and novel approaches
- Create a compelling narrative that connects all insights
</creative_synthesis_focus>`
  }
}

/**
 * Get mode-specific instructions for DesignPhilosopher
 */
function getDesignPhilosopherMode(mode: Mode): string {
  switch (mode) {
    case "pr":
    case "design_review":
      return `You are the DesignPhilosopher operating in "principles mode".

<strict_constraints>
- Do NOT reference history, movements, or philosophy
- Output must be concise and actionable
- Deliver 3–5 design principles tied to user needs and business goals
- Prefer statements like "Use semantic tokens and OKLCH with ΔL<2 across status colors" over any narrative
- Focus on what works, not why it's historically significant
</strict_constraints>`

    case "explore":
      return `You are the DesignPhilosopher operating in "exploration mode".

<creative_license>
- You MAY reference historical contexts when they inspire innovation
- Connect concepts across disciplines and time periods
- Explore aesthetic and philosophical dimensions
- Build narrative around design choices
- Think expansively about possibilities and meaning
</creative_license>`
  }
}