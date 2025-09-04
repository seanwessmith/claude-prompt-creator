import { Effect } from "effect"
import { OpenAIService } from "../services/OpenAIService"
import { Database } from "bun:sqlite"

export interface DynamicAgent {
  id: string
  name: string
  domain: string
  expertise: string[]
  prompt: string
  capabilities: string[]
  createdAt: Date
  taskContext: string
}

export interface AgentSpec {
  name: string
  domain: string
  expertise: string[]
  capabilities: string[]
  systemPrompt: string
}

export class DynamicAgentFactory {
  private db: Database
  private openai: OpenAIService.Service
  private agentCache: Map<string, DynamicAgent> = new Map()

  constructor(openai: OpenAIService.Service, dbPath: string = "./dynamic_agents.db") {
    this.openai = openai
    this.db = new Database(dbPath)
    this.initDatabase()
    this.loadCachedAgents()
  }

  private initDatabase() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS dynamic_agents (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        domain TEXT NOT NULL,
        expertise TEXT NOT NULL,
        prompt TEXT NOT NULL,
        capabilities TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        task_context TEXT NOT NULL,
        usage_count INTEGER DEFAULT 0,
        success_rate REAL DEFAULT 0.0
      )
    `)

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_domain ON dynamic_agents(domain)
    `)

    this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_usage ON dynamic_agents(usage_count DESC)
    `)
  }

  private loadCachedAgents() {
    const agents = this.db.query("SELECT * FROM dynamic_agents ORDER BY usage_count DESC LIMIT 100").all() as any[]
    for (const agent of agents) {
      this.agentCache.set(agent.id, {
        id: agent.id,
        name: agent.name,
        domain: agent.domain,
        expertise: JSON.parse(agent.expertise),
        prompt: agent.prompt,
        capabilities: JSON.parse(agent.capabilities),
        createdAt: new Date(agent.created_at),
        taskContext: agent.task_context
      })
    }
  }

  /**
   * Analyzes task and existing agents to determine if new agents are needed
   */
  analyzeAgentNeeds(task: string, existingAgents: string[]): Effect.Effect<{
    needed: boolean
    missingCapabilities: string[]
    suggestedDomains: string[]
  }, Error> {
    const self = this
    return Effect.gen(function* () {
      const prompt = `Analyze this task and determine if new specialized agents are needed beyond the existing ones.

Task: "${task}"

Existing agents: ${existingAgents.join(", ")}

Analyze:
1. What capabilities are missing from existing agents?
2. What new domains of expertise would be valuable?
3. Should we create new agents? (yes/no)

Respond in JSON:
{
  "needed": boolean,
  "missingCapabilities": ["capability1", "capability2"],
  "suggestedDomains": ["domain1", "domain2"]
}`

      const response = yield* self.openai.generateResponse(prompt, {
        reasoningEffort: "medium",
        verbosity: "low"
      })

      try {
        return JSON.parse(response.content)
      } catch {
        return {
          needed: false,
          missingCapabilities: [],
          suggestedDomains: []
        }
      }
    })
  }

  /**
   * Creates a new agent dynamically based on task requirements
   */
  createAgent(taskContext: string, domain: string, missingCapabilities: string[]): Effect.Effect<DynamicAgent, Error> {
    return Effect.gen(function* (_) {
      // Check if similar agent exists in cache
      const cacheKey = `${domain}-${missingCapabilities.sort().join("-")}`
      const cached = this.agentCache.get(cacheKey)
      if (cached) {
        this.incrementUsage(cached.id)
        return cached
      }

      // Generate agent specification using AI
      const spec = yield* _(this.generateAgentSpec(taskContext, domain, missingCapabilities))
      
      // Create the agent
      const agent: DynamicAgent = {
        id: this.generateAgentId(spec.name),
        name: spec.name,
        domain: spec.domain,
        expertise: spec.expertise,
        prompt: spec.systemPrompt,
        capabilities: spec.capabilities,
        createdAt: new Date(),
        taskContext: taskContext
      }

      // Store in database
      this.storeAgent(agent)
      
      // Cache the agent
      this.agentCache.set(cacheKey, agent)
      this.agentCache.set(agent.id, agent)

      return agent
    }.bind(this))
  }

  /**
   * Generates agent specification using AI
   */
  private generateAgentSpec(taskContext: string, domain: string, capabilities: string[]): Effect.Effect<AgentSpec, Error> {
    const self = this
    return Effect.gen(function* () {
      const prompt = `Create a specialized AI agent for the following context:

Task Context: "${taskContext}"
Domain: "${domain}"
Required Capabilities: ${capabilities.join(", ")}

Design an agent with:
1. A unique, descriptive name (e.g., "DataFlowOptimizer", "UserJourneyArchitect")
2. Clear domain of expertise
3. Specific expertise areas (3-5)
4. Concrete capabilities it provides
5. A system prompt that defines its personality and approach

The agent should be highly specialized and creative in its domain.

Respond in JSON:
{
  "name": "AgentName",
  "domain": "specific domain",
  "expertise": ["area1", "area2", "area3"],
  "capabilities": ["capability1", "capability2"],
  "systemPrompt": "You are [name], a specialist in [domain]. Your approach is..."
}`

      const response = yield* self.openai.generateResponse(prompt, {
        reasoningEffort: "high",
        verbosity: "medium"
      })

      try {
        const spec = JSON.parse(response.content)
        
        // Enhance the system prompt with more detail
        spec.systemPrompt = yield* self.enhanceSystemPrompt(spec)
        
        return spec as AgentSpec
      } catch (error) {
        // Fallback to a basic agent spec
        return {
          name: `${domain}Specialist`,
          domain: domain,
          expertise: capabilities,
          capabilities: capabilities,
          systemPrompt: `You are a specialist in ${domain}. Focus on: ${capabilities.join(", ")}`
        }
      }
    }.bind(this))
  }

  /**
   * Enhances the system prompt with more sophisticated instructions
   */
  private enhanceSystemPrompt(spec: AgentSpec): Effect.Effect<string, Error> {
    const self = this
    return Effect.gen(function* () {
      const enhancementPrompt = `Enhance this agent's system prompt to be more sophisticated and effective:

Agent: ${spec.name}
Domain: ${spec.domain}
Expertise: ${spec.expertise.join(", ")}
Basic Prompt: ${spec.systemPrompt}

Create a detailed system prompt that:
1. Defines the agent's unique perspective and approach
2. Includes specific methodologies or frameworks it uses
3. Describes how it collaborates with other agents
4. Emphasizes creative and innovative thinking in its domain
5. Includes 2-3 signature techniques or principles

Make it compelling and distinctive. The agent should feel like a real expert with depth.`

      const response = yield* this.openai.generateResponse(enhancementPrompt, {
        reasoningEffort: "high",
        verbosity: "high"
      })

      return response.content
    }.bind(this))
  }

  /**
   * Finds or creates agents for a specific task
   */
  findOrCreateAgents(task: string, requiredDomains: string[]): Effect.Effect<DynamicAgent[], Error> {
    return Effect.gen(function* (_) {
      const agents: DynamicAgent[] = []

      for (const domain of requiredDomains) {
        // First, try to find existing agents for this domain
        const existing = yield* _(this.findAgentsByDomain(domain))
        
        if (existing.length > 0) {
          // Use the most successful existing agent
          agents.push(existing[0])
        } else {
          // Create a new agent for this domain
          const analysisResult = yield* _(this.analyzeAgentNeeds(task, agents.map(a => a.name)))
          
          if (analysisResult.needed) {
            const newAgent = yield* _(this.createAgent(
              task,
              domain,
              analysisResult.missingCapabilities
            ))
            agents.push(newAgent)
          }
        }
      }

      return agents
    }.bind(this))
  }

  /**
   * Evolves agents based on performance feedback
   */
  evolveAgent(agentId: string, feedback: {
    success: boolean
    improvements?: string[]
  }): Effect.Effect<DynamicAgent, Error> {
    return Effect.gen(function* (_) {
      const agent = this.agentCache.get(agentId)
      if (!agent) {
        return yield* _(Effect.fail(new Error(`Agent ${agentId} not found`)))
      }

      // Update success rate
      this.updateSuccessRate(agentId, feedback.success)

      if (feedback.improvements && feedback.improvements.length > 0) {
        // Generate an improved version of the agent
        const improvedPrompt = yield* _(this.improveAgentPrompt(agent, feedback.improvements))
        
        // Create a new version of the agent
        const evolvedAgent: DynamicAgent = {
          ...agent,
          id: `${agent.id}-v${Date.now()}`,
          prompt: improvedPrompt,
          createdAt: new Date()
        }

        this.storeAgent(evolvedAgent)
        this.agentCache.set(evolvedAgent.id, evolvedAgent)
        
        return evolvedAgent
      }

      return agent
    }.bind(this))
  }

  private improveAgentPrompt(agent: DynamicAgent, improvements: string[]): Effect.Effect<string, Error> {
    const self = this
    return Effect.gen(function* () {
      const prompt = `Improve this agent's system prompt based on feedback:

Current Agent: ${agent.name}
Current Prompt: ${agent.prompt}

Suggested Improvements:
${improvements.map((imp, i) => `${i + 1}. ${imp}`).join("\n")}

Generate an improved system prompt that incorporates these improvements while maintaining the agent's core identity and expertise.`

      const response = yield* self.openai.generateResponse(prompt, {
        reasoningEffort: "high",
        verbosity: "medium"
      })

      return response.content
    }.bind(this))
  }

  /**
   * Combines multiple agents into a collaborative team
   */
  createAgentTeam(task: string, agents: DynamicAgent[]): Effect.Effect<{
    leader: DynamicAgent
    team: DynamicAgent[]
    collaborationStrategy: string
  }, Error> {
    const self = this
    return Effect.gen(function* () {
      const prompt = `Given this task and team of agents, design a collaboration strategy:

Task: "${task}"

Agents:
${agents.map(a => `- ${a.name}: ${a.domain} specialist with expertise in ${a.expertise.join(", ")}`).join("\n")}

Determine:
1. Which agent should lead this task
2. How the agents should collaborate
3. The order of contributions

Respond in JSON:
{
  "leaderId": "agent_id",
  "collaborationStrategy": "detailed strategy description",
  "contributionOrder": ["agent_id1", "agent_id2", ...]
}`

      const response = yield* self.openai.generateResponse(prompt, {
        reasoningEffort: "medium",
        verbosity: "low"
      })

      try {
        const strategy = JSON.parse(response.content)
        const leader = agents.find(a => a.id === strategy.leaderId) || agents[0]
        
        return {
          leader,
          team: agents,
          collaborationStrategy: strategy.collaborationStrategy
        }
      } catch {
        return {
          leader: agents[0],
          team: agents,
          collaborationStrategy: "Sequential collaboration with peer review"
        }
      }
    }.bind(this))
  }

  private findAgentsByDomain(domain: string): Effect.Effect<DynamicAgent[], Error> {
    return Effect.sync(() => {
      const agents = this.db.query(`
        SELECT * FROM dynamic_agents 
        WHERE domain = ? 
        ORDER BY success_rate DESC, usage_count DESC 
        LIMIT 5
      `).all(domain) as any[]

      return agents.map((agent: any) => ({
        id: agent.id,
        name: agent.name,
        domain: agent.domain,
        expertise: JSON.parse(agent.expertise),
        prompt: agent.prompt,
        capabilities: JSON.parse(agent.capabilities),
        createdAt: new Date(agent.created_at),
        taskContext: agent.task_context
      }))
    })
  }

  private storeAgent(agent: DynamicAgent) {
    this.db.run(`
      INSERT INTO dynamic_agents (id, name, domain, expertise, prompt, capabilities, created_at, task_context)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      agent.id,
      agent.name,
      agent.domain,
      JSON.stringify(agent.expertise),
      agent.prompt,
      JSON.stringify(agent.capabilities),
      agent.createdAt.getTime(),
      agent.taskContext
    ])
  }

  private incrementUsage(agentId: string) {
    this.db.run(`
      UPDATE dynamic_agents 
      SET usage_count = usage_count + 1 
      WHERE id = ?
    `, [agentId])
  }

  private updateSuccessRate(agentId: string, success: boolean) {
    const currentStats = this.db.query(`
      SELECT usage_count, success_rate FROM dynamic_agents WHERE id = ?
    `).get(agentId) as any

    if (currentStats) {
      const totalSuccesses = currentStats.success_rate * currentStats.usage_count
      const newSuccessRate = (totalSuccesses + (success ? 1 : 0)) / (currentStats.usage_count + 1)
      
      this.db.run(`
        UPDATE dynamic_agents 
        SET success_rate = ?, usage_count = usage_count + 1
        WHERE id = ?
      `, [newSuccessRate, agentId])
    }
  }

  private generateAgentId(name: string): string {
    return `${name.toLowerCase().replace(/\s+/g, "_")}_${Date.now()}`
  }

  close() {
    this.db.close()
  }
}