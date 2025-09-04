import { Effect } from "effect"
import { type DynamicAgent, DynamicAgentFactory } from "./DynamicAgentFactory"
import { OpenAIService } from "../services/OpenAIService"

export interface Expert {
  name: string
  domains: string[]
  prompt: string
  type: "static" | "dynamic"
  dynamicAgent?: DynamicAgent
}

export interface ExpertGroup {
  conceptual: Expert[]
  technical: Expert[]
  dynamic: Expert[]
}

export class ExpertRegistry {
  private static staticConceptualExperts: Record<string, Expert> = {
    DesignPhilosopher: {
      name: "DesignPhilosopher",
      domains: ["visual", "interaction", "system"],
      prompt: "Find deeper meaning and historical resonance",
      type: "static"
    },
    ExperienceArchitect: {
      name: "ExperienceArchitect", 
      domains: ["emotional", "workflow", "usability"],
      prompt: "Define how it should feel to use",
      type: "static"
    },
    SystemsTheorist: {
      name: "SystemsTheorist",
      domains: ["architecture", "data", "complexity"],
      prompt: "Identify elegant organizational principles",
      type: "static"
    },
    TechnicalPoet: {
      name: "TechnicalPoet",
      domains: ["integration", "abstraction", "elegance"],
      prompt: "Bridge conceptual and technical realms with elegance",
      type: "static"
    },
    MasterReviewer: {
      name: "MasterReviewer",
      domains: ["synthesis", "optimization", "quality", "coherence"],
      prompt: `You are the MasterReviewer, the final arbiter of quality and coherence.
      
Your role is to:
1. SYNTHESIZE all previous expert contributions into a coherent whole
2. IDENTIFY gaps, contradictions, or areas needing refinement
3. OPTIMIZE the overall solution for elegance, performance, and maintainability
4. ENSURE all requirements have been met comprehensively
5. PROVIDE specific, actionable improvements where needed
6. VALIDATE that the solution follows best practices and patterns

You have access to all previous expert outputs and should:
- Cross-reference recommendations from different experts
- Resolve any conflicts between expert opinions
- Highlight the most critical aspects of the solution
- Suggest concrete optimizations and improvements
- Ensure nothing important has been overlooked

Your review should be thorough yet focused, using deep reasoning to provide maximum value.`,
      type: "static"
    }
  }

  private static staticTechnicalExperts: Record<string, string[]> = {
    React: ["ReactArchitect", "HooksPhilosopher", "ComponentComposer"],
    Effect: ["EffectArchitect", "EffectPipeline", "ErrorTaxonomist", "ServiceLayerDesigner"],
    JSON: ["SchemaDesigner", "DataModeler"],
    CLI: ["CommandGrammar", "UnixPhilosopher"],
    TypeScript: ["TypeWizard", "GenericSpecialist"],
    Database: ["DataArchitect", "QueryOptimizer"],
    API: ["RESTPhilosopher", "GraphQLArchitect", "WebSocketStrategist"]
  }

  private agentFactory: DynamicAgentFactory
  private openai: OpenAIService.Service
  private dynamicExperts: Map<string, Expert> = new Map()

  constructor(openai: OpenAIService.Service, agentFactory: DynamicAgentFactory) {
    this.openai = openai
    this.agentFactory = agentFactory
  }

  /**
   * Intelligently selects experts based on task analysis
   */
  selectExperts(task: string, mode: "conceptual" | "technical" | "both"): Effect.Effect<ExpertGroup, Error> {
    return Effect.gen(function* (_) {
      const group: ExpertGroup = {
        conceptual: [],
        technical: [],
        dynamic: []
      }

      // Analyze task to understand requirements
      const taskAnalysis = yield* _(this.analyzeTask(task))

      if (mode === "conceptual" || mode === "both") {
        // Select static conceptual experts
        group.conceptual = this.selectStaticConceptualExperts(taskAnalysis)

        // Check if we need dynamic conceptual experts
        const missingConceptual = yield* _(this.identifyMissingExpertise(
          task,
          group.conceptual.map(e => e.domains).flat(),
          "conceptual"
        ))

        if (missingConceptual.length > 0) {
          const dynamicConceptual = yield* _(this.createDynamicExperts(
            task,
            missingConceptual,
            "conceptual"
          ))
          group.dynamic.push(...dynamicConceptual)
        }
      }

      if (mode === "technical" || mode === "both") {
        // Select static technical experts
        group.technical = this.selectStaticTechnicalExperts(taskAnalysis)

        // Check if we need dynamic technical experts
        const missingTechnical = yield* _(this.identifyMissingExpertise(
          task,
          group.technical.map(e => e.domains).flat(),
          "technical"
        ))

        if (missingTechnical.length > 0) {
          const dynamicTechnical = yield* _(this.createDynamicExperts(
            task,
            missingTechnical,
            "technical"
          ))
          group.dynamic.push(...dynamicTechnical)
        }
      }

      return group
    }.bind(this))
  }

  /**
   * Analyzes task to understand domain requirements
   */
  private analyzeTask(task: string): Effect.Effect<{
    domains: string[]
    technologies: string[]
    complexity: "simple" | "moderate" | "complex"
    novelty: "standard" | "unique" | "innovative"
  }, Error> {
    return Effect.gen(function* () {
      const prompt = `Analyze this task to understand its requirements:

Task: "${task}"

Identify:
1. Key domains involved (e.g., visual, data, interaction, performance)
2. Technologies mentioned or implied (e.g., React, database, API)
3. Complexity level (simple/moderate/complex)
4. Novelty level (standard/unique/innovative)

Respond in JSON:
{
  "domains": ["domain1", "domain2"],
  "technologies": ["tech1", "tech2"],
  "complexity": "moderate",
  "novelty": "unique"
}`

      const response = yield* this.openai.generateResponse(prompt, {
        reasoningEffort: "medium",
        verbosity: "low"
      })

      try {
        return JSON.parse(response.content)
      } catch {
        return {
          domains: ["general"],
          technologies: [],
          complexity: "moderate",
          novelty: "standard"
        }
      }
    }.bind(this))
  }

  /**
   * Identifies missing expertise not covered by selected experts
   */
  private identifyMissingExpertise(
    task: string,
    coveredDomains: string[],
    expertType: "conceptual" | "technical"
  ): Effect.Effect<string[], Error> {
    return Effect.gen(function* () {
      const prompt = `Given this task and covered domains, identify missing expertise:

Task: "${task}"
Expert Type: ${expertType}
Covered Domains: ${coveredDomains.join(", ")}

What specific ${expertType} expertise is missing that would be valuable for this task?
Consider unique aspects of the task that standard experts might not cover.

List up to 3 missing areas of expertise (or empty array if none needed):
JSON array format: ["expertise1", "expertise2"]`

      const response = yield* this.openai.generateResponse(prompt, {
        reasoningEffort: "medium",
        verbosity: "low"
      })

      try {
        const missing = JSON.parse(response.content)
        return Array.isArray(missing) ? missing : []
      } catch {
        return []
      }
    }.bind(this))
  }

  /**
   * Creates dynamic experts for missing expertise areas
   */
  private createDynamicExperts(
    task: string,
    missingAreas: string[],
    expertType: "conceptual" | "technical"
  ): Effect.Effect<Expert[], Error> {
    return Effect.gen(function* (_) {
      const experts: Expert[] = []

      for (const area of missingAreas) {
        // Check if we already have a dynamic expert for this area
        const cacheKey = `${expertType}-${area}`
        const cached = this.dynamicExperts.get(cacheKey)
        
        if (cached) {
          experts.push(cached)
        } else {
          // Create a new dynamic agent for this expertise area
          const agent = yield* _(this.agentFactory.createAgent(
            task,
            area,
            this.getCapabilitiesForArea(area, expertType)
          ))

          const expert: Expert = {
            name: agent.name,
            domains: [area, ...agent.expertise],
            prompt: agent.prompt,
            type: "dynamic",
            dynamicAgent: agent
          }

          this.dynamicExperts.set(cacheKey, expert)
          experts.push(expert)
        }
      }

      return experts
    }.bind(this))
  }

  /**
   * Determines capabilities needed for an expertise area
   */
  private getCapabilitiesForArea(area: string, expertType: "conceptual" | "technical"): string[] {
    const capabilityMap: Record<string, string[]> = {
      // Conceptual capabilities
      "gamification": ["engagement mechanics", "reward systems", "progression design"],
      "accessibility": ["WCAG compliance", "screen reader optimization", "inclusive design"],
      "sustainability": ["green computing", "resource optimization", "carbon footprint analysis"],
      "psychology": ["cognitive load", "behavioral patterns", "user motivation"],
      
      // Technical capabilities  
      "realtime": ["WebSocket management", "event streaming", "conflict resolution"],
      "ai": ["prompt engineering", "model selection", "inference optimization"],
      "blockchain": ["smart contracts", "consensus mechanisms", "decentralization patterns"],
      "edge": ["CDN optimization", "edge functions", "distributed caching"],
      "observability": ["tracing", "metrics collection", "log aggregation"],
      "security": ["threat modeling", "encryption", "authentication patterns"]
    }

    return capabilityMap[area.toLowerCase()] || 
           [`${area} analysis`, `${area} optimization`, `${area} best practices`]
  }

  /**
   * Selects static conceptual experts based on task analysis
   */
  private selectStaticConceptualExperts(analysis: any): Expert[] {
    const experts: Expert[] = []
    const relevantExperts = new Set<string>()

    // Match domains to experts
    for (const domain of analysis.domains) {
      for (const [expertName, expert] of Object.entries(ExpertRegistry.staticConceptualExperts)) {
        if (expert.domains.some(d => domain.includes(d) || d.includes(domain))) {
          relevantExperts.add(expertName)
        }
      }
    }

    // Add experts based on complexity and novelty
    if (analysis.complexity === "complex") {
      relevantExperts.add("SystemsTheorist")
    }

    if (analysis.novelty === "innovative") {
      relevantExperts.add("DesignPhilosopher")
      relevantExperts.add("TechnicalPoet")
    }

    // Convert to Expert objects
    for (const expertName of relevantExperts) {
      experts.push(ExpertRegistry.staticConceptualExperts[expertName])
    }

    // Ensure minimum of 2 experts
    if (experts.length < 2) {
      experts.push(ExpertRegistry.staticConceptualExperts.ExperienceArchitect)
      if (experts.length < 2) {
        experts.push(ExpertRegistry.staticConceptualExperts.DesignPhilosopher)
      }
    }

    return experts.slice(0, 5) // Max 5 experts
  }

  /**
   * Selects static technical experts based on task analysis
   */
  private selectStaticTechnicalExperts(analysis: any): Expert[] {
    const experts: Expert[] = []

    for (const tech of analysis.technologies) {
      const techExperts = ExpertRegistry.staticTechnicalExperts[tech] || []
      for (const expertName of techExperts) {
        experts.push({
          name: expertName,
          domains: [tech.toLowerCase()],
          prompt: `Technical expert in ${tech}`,
          type: "static"
        })
      }
    }

    // Add Effect experts by default if using TypeScript
    if (analysis.technologies.includes("TypeScript") || 
        analysis.technologies.length === 0) {
      for (const expertName of ExpertRegistry.staticTechnicalExperts.Effect) {
        experts.push({
          name: expertName,
          domains: ["effect", "functional"],
          prompt: `Effect ecosystem expert`,
          type: "static"
        })
      }
    }

    return experts.slice(0, 6) // Max 6 technical experts
  }

  /**
   * Merges static and dynamic experts into a unified team
   */
  mergeExperts(group: ExpertGroup): Expert[] {
    return [
      ...group.conceptual,
      ...group.technical,
      ...group.dynamic
    ]
  }

  /**
   * Evaluates expert performance and evolves them
   */
  evaluateAndEvolve(
    expert: Expert,
    taskResult: {
      success: boolean
      feedback?: string[]
    }
  ): Effect.Effect<Expert, Error> {
    return Effect.gen(function* (_) {
      if (expert.type === "dynamic" && expert.dynamicAgent) {
        const evolved = yield* _(this.agentFactory.evolveAgent(
          expert.dynamicAgent.id,
          {
            success: taskResult.success,
            improvements: taskResult.feedback
          }
        ))

        return {
          ...expert,
          dynamicAgent: evolved,
          prompt: evolved.prompt
        }
      }

      return expert
    }.bind(this))
  }
}