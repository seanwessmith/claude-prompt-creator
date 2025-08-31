#!/usr/bin/env bun

import { Effect, Console } from "effect"
import { OpenAIService } from "./src/services/OpenAIService"
import { inferModeWithAI, planRounds } from "./src/core/ModeInference"
import { ExpertRegistry } from "./src/core/ExpertRegistry"

const testModeInference = Effect.gen(function* () {
  const openai = yield* OpenAIService
  const experts = new ExpertRegistry()
  
  const testCases = [
    // PR Mode Tests
    "implement user authentication with JWT tokens",
    "add dark mode toggle to the settings page", 
    "fix the memory leak in the image upload component",
    "create a new API endpoint for user profiles",
    
    // Design Review Mode Tests
    "review the current authentication system for security issues",
    "audit the component library for consistency problems",
    "refactor the data fetching logic to improve performance",
    "check the accessibility of the checkout flow",
    
    // Explore Mode Tests
    "explore different approaches for a creative portfolio website",
    "brainstorm ideas for a color theme system",
    "research innovative navigation patterns for mobile apps",
    "conceptualize a new user onboarding experience"
  ]
  
  yield* Console.log("🧪 Testing Mode Inference with AI...")
  
  for (const task of testCases) {
    yield* Console.log(`\n📝 Task: "${task}"`)
    
    try {
      const mode = yield* inferModeWithAI(task, openai)
      const rounds = planRounds(mode)
      
      yield* Console.log(`✅ Mode: ${mode.toUpperCase()}`)
      yield* Console.log(`📋 Rounds: ${rounds.map(r => `${r.lead}(${r.focus})`).join(" → ")}`)
      
      // Test expert selection for first round
      const mockContext = {
        task,
        outputType: "general",
        constraints: {},
        preferences: {},
        inspirationSeeds: [],
        mode,
        rounds
      }
      
      if (rounds.length > 0) {
        const selectedExperts = experts.selectExpertsForRound(rounds[0], mode, mockContext)
        yield* Console.log(`👥 Experts: ${selectedExperts.join(", ")}`)
        
        // Test DesignPhilosopher mode-specific behavior
        if (rounds[0].lead === "DesignPhilosopher") {
          const { systemPrompt } = experts.generateRoundPrompt(
            rounds[0], 
            selectedExperts, 
            mockContext, 
            {}, 
            mode
          )
          
          const hasHistoricalReferences = systemPrompt.includes("history") || systemPrompt.includes("historical")
          const hasPrinciplesOnly = systemPrompt.includes("principles mode") || systemPrompt.includes("Do NOT reference history")
          
          if (mode === "explore" && hasHistoricalReferences) {
            yield* Console.log(`🎨 ✅ Exploration mode allows historical context`)
          } else if ((mode === "pr" || mode === "design_review") && hasPrinciplesOnly) {
            yield* Console.log(`⚙️ ✅ ${mode} mode uses principles-only approach`)
          } else if (mode === "explore" && !hasHistoricalReferences) {
            yield* Console.log(`❌ Exploration mode should allow historical context`)
          } else if ((mode === "pr" || mode === "design_review") && !hasPrinciplesOnly) {
            yield* Console.log(`❌ ${mode} mode should use principles-only approach`)
          }
        }
      }
      
    } catch (error) {
      yield* Console.error(`❌ Error processing "${task}": ${error}`)
    }
  }
  
  yield* Console.log(`\n🎉 Mode inference testing complete!`)
})

// Run test with OpenAI service
const main = testModeInference.pipe(
  Effect.provide(OpenAIService.Live),
  Effect.catchAll((error) => 
    Console.error(`❌ Test Error: ${error}`)
  )
)

Effect.runPromise(main).catch(console.error)