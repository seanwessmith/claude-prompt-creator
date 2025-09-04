import { Effect } from "effect"
import { DynamicAgentFactory } from "../core/DynamicAgentFactory"
import { ExpertRegistry } from "../core/ExpertRegistry"
import type { OpenAIService } from "../services/OpenAIService"
import { inferModeWithAI, planRounds, getExpertConfig } from "../core/ModeInference"

/**
 * Mock OpenAI service for testing
 */
function createMockOpenAIService(): OpenAIService.Service {
  let responseCounter = 0
  
  return {
    generateResponse: (prompt: string, config?: any) => {
      responseCounter++
      
      // Simulate different responses based on prompt content
      if (prompt.includes("Analyze this task")) {
        return Effect.succeed({
          content: JSON.stringify({
            domains: ["gamification", "user_engagement"],
            technologies: ["React", "TypeScript"],
            complexity: "complex",
            novelty: "innovative"
          }),
          responseId: `response_${responseCounter}`
        })
      }
      
      if (prompt.includes("missing expertise")) {
        return Effect.succeed({
          content: JSON.stringify(["realtime", "machine_learning"]),
          responseId: `response_${responseCounter}`
        })
      }
      
      if (prompt.includes("Create a specialized AI agent")) {
        return Effect.succeed({
          content: JSON.stringify({
            name: "DynamicSpecialist_" + responseCounter,
            domain: "specialized_domain",
            expertise: ["analysis", "optimization", "innovation"],
            capabilities: ["deep_analysis", "pattern_recognition"],
            systemPrompt: "You are a specialized agent focused on innovative solutions."
          }),
          responseId: `response_${responseCounter}`
        })
      }
      
      // Default response
      return Effect.succeed({
        content: "Default response for: " + prompt.substring(0, 50),
        responseId: `response_${responseCounter}`
      })
    },
    
    trackExpertInteraction: () => Effect.succeed(undefined),
    getExpertInteractions: () => Effect.succeed([])
  }
}

/**
 * Example demonstrating dynamic agent creation for various tasks
 */
async function testDynamicAgents() {
  // Initialize mock service for testing
  const openaiService = createMockOpenAIService()
  
  const agentFactory = new DynamicAgentFactory(openaiService)
  const expertRegistry = new ExpertRegistry(openaiService, agentFactory)

  // Test scenarios that should trigger dynamic agent creation
  const testScenarios = [
    {
      name: "Gamification System",
      task: "Design a gamification system for a language learning app with badges, streaks, and social competition features"
    },
    {
      name: "Real-time Collaboration",
      task: "Build a real-time collaborative whiteboard with WebSockets, conflict resolution, and presence indicators"
    },
    {
      name: "AI-Powered Analytics",
      task: "Create an AI-powered analytics dashboard that uses machine learning to identify trends and anomalies in user behavior"
    },
    {
      name: "Accessibility-First Design",
      task: "Redesign the checkout flow to be fully accessible with screen reader support, keyboard navigation, and WCAG compliance"
    },
    {
      name: "Blockchain Integration", 
      task: "Integrate smart contract functionality for NFT minting and trading in our marketplace application"
    }
  ]

  console.log("🚀 Testing Dynamic Agent Creation System\n")
  console.log("=" .repeat(60))

  for (const scenario of testScenarios) {
    console.log(`\n📋 Scenario: ${scenario.name}`)
    console.log(`Task: ${scenario.task}\n`)

    try {
      // Step 1: Infer mode for the task
      const mode = await Effect.runPromise(inferModeWithAI(scenario.task, openaiService))
      console.log(`  ✓ Inferred Mode: ${mode}`)

      // Step 2: Select experts (including dynamic ones if needed)
      const expertGroup = await Effect.runPromise(
        expertRegistry.selectExperts(scenario.task, "both")
      )

      console.log(`\n  📚 Selected Experts:`)
      
      if (expertGroup.conceptual.length > 0) {
        console.log(`    Conceptual (${expertGroup.conceptual.length}):`);
        expertGroup.conceptual.forEach(e => 
          console.log(`      - ${e.name} [${e.type}]: ${e.domains.join(", ")}`)
        )
      }

      if (expertGroup.technical.length > 0) {
        console.log(`    Technical (${expertGroup.technical.length}):`)
        expertGroup.technical.forEach(e => 
          console.log(`      - ${e.name} [${e.type}]: ${e.domains.join(", ")}`)
        )
      }

      if (expertGroup.dynamic.length > 0) {
        console.log(`    🆕 Dynamic Agents Created (${expertGroup.dynamic.length}):`)
        expertGroup.dynamic.forEach(e => {
          console.log(`      - ${e.name}: ${e.domains.join(", ")}`)
          if (e.dynamicAgent) {
            console.log(`        Capabilities: ${e.dynamicAgent.capabilities.join(", ")}`)
            console.log(`        Expertise: ${e.dynamicAgent.expertise.join(", ")}`)
          }
        })
      }

      // Step 3: Plan rounds with dynamic agents
      const rounds = await Effect.runPromise(
        planRounds(mode, scenario.task, agentFactory)
      )

      console.log(`\n  🔄 Execution Rounds (${rounds.length}):`)
      rounds.forEach((round, i) => {
        const isDynamic = round.dynamicAgent ? " [DYNAMIC]" : ""
        const isMasterReviewer = round.lead === "MasterReviewer" ? " 🧠[GPT-5-HIGH]" : ""
        console.log(`    ${i + 1}. ${round.focus} - Lead: ${round.lead}${isDynamic}${isMasterReviewer}`)
      })

      // Show MasterReviewer configuration if present
      const masterReviewRound = rounds.find(r => r.lead === "MasterReviewer")
      if (masterReviewRound) {
        const config = getExpertConfig("MasterReviewer", mode)
        console.log(`\n  🎯 MasterReviewer Config:`)
        console.log(`    Reasoning Effort: ${config.reasoningEffort.toUpperCase()}`)
        console.log(`    Focus: ${masterReviewRound.focus}`)
        console.log(`    Role: Final synthesis, optimization & quality assurance`)
      }

      // Step 4: Test agent collaboration
      const allExperts = expertRegistry.mergeExperts(expertGroup)
      if (allExperts.length > 2) {
        const team = await Effect.runPromise(
          agentFactory.createAgentTeam(
            scenario.task,
            allExperts.filter(e => e.dynamicAgent).map(e => e.dynamicAgent!)
          )
        )
        
        if (team.collaborationStrategy) {
          console.log(`\n  🤝 Collaboration Strategy:`)
          console.log(`    Leader: ${team.leader?.name || "N/A"}`)
          console.log(`    Strategy: ${team.collaborationStrategy}`)
        }
      }

      // Simulate performance feedback and evolution
      if (expertGroup.dynamic.length > 0) {
        console.log(`\n  🔧 Agent Evolution:`)
        const firstDynamic = expertGroup.dynamic[0]
        const evolved = await Effect.runPromise(
          expertRegistry.evaluateAndEvolve(firstDynamic, {
            success: true,
            feedback: ["Consider edge cases for offline mode", "Add better error messages"]
          })
        )
        console.log(`    ${firstDynamic.name} evolved based on feedback`)
      }

    } catch (error) {
      console.error(`  ❌ Error: ${error}`)
    }

    console.log("\n" + "-".repeat(60))
  }

  // Show agent reuse
  console.log("\n📊 Testing Agent Reuse:")
  console.log("Running similar task to test cache hit...")
  
  const reuseTask = "Create another gamification system for a fitness tracking app"
  const reuseExperts = await Effect.runPromise(
    expertRegistry.selectExperts(reuseTask, "conceptual")
  )
  
  console.log(`  Task: ${reuseTask}`)
  console.log(`  Result: Found ${reuseExperts.dynamic.length} cached dynamic agents`)
  if (reuseExperts.dynamic.length > 0) {
    console.log("  ✓ Agent reuse working correctly!")
  }

  // Cleanup
  agentFactory.close()
  console.log("\n✅ Dynamic Agent System Test Complete!")
}

// Run the test
if (import.meta.main) {
  testDynamicAgents().catch(console.error)
}