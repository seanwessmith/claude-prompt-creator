import { Effect } from "effect"
import { OpenAIService } from "../services/OpenAIService"

export type Mode = "pr" | "design_review" | "explore"

export interface Round {
  focus: string
  lead: string
}

export const roundsByMode: Record<Mode, Round[]> = {
  pr: [
    { focus: "constraints", lead: "SpecScribe" },
    { focus: "architecture_plan", lead: "EffectArchitect" },
    { focus: "tests_first", lead: "TestEngineer" },
    { focus: "impl", lead: "CodeGen" },
    { focus: "consistency_gate", lead: "DXEnforcer" },
    { focus: "pr_summary", lead: "PRWriter" }
  ],
  design_review: [
    { focus: "design_principles", lead: "DesignPhilosopher" },
    { focus: "architecture_plan", lead: "EffectArchitect" },
    { focus: "consistency_gate", lead: "DXEnforcer" }
  ],
  explore: [
    { focus: "concepts", lead: "DesignPhilosopher" },
    { focus: "experience_goals", lead: "ExperienceArchitect" },
    { focus: "technical_bridge", lead: "TechnicalPoet" }
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

    try {
      const response = yield* openai.generateResponse(
        userPrompt,
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
 * Plan rounds based on inferred mode
 */
export function planRounds(mode: Mode): Round[] {
  return roundsByMode[mode]
}

/**
 * Get mode-specific instructions for DesignPhilosopher
 */
export function getDesignPhilosopherMode(mode: Mode): string {
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