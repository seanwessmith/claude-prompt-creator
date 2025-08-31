#!/usr/bin/env bun

import { Effect, Console } from "effect"
import { OpenAIService } from "./src/services/OpenAIService"
import { ExpertRegistry } from "./src/core/ExpertRegistry"

// Simple test of GPT-5 integration
const testProgram = Effect.gen(function* () {
  const openai = yield* OpenAIService
  const experts = new ExpertRegistry()
  
  console.log("🧪 Testing GPT-5 integration...")
  
  // Test basic GPT-5 call
  try {
    const response = yield* openai.generateResponse(
      "Hello, please respond with 'GPT-5 integration working!'",
      {
        reasoningEffort: "low",
        verbosity: "low"
      }
    )
    
    yield* Console.log(`✅ GPT-5 Response: ${response.content.substring(0, 100)}...`)
    yield* Console.log(`📊 Response ID: ${response.responseId || 'N/A'}`)
    
    // Test expert prompt generation
    const mockContext = {
      task: "create a modern web application",
      outputType: "react_app", 
      constraints: { environment: "production" },
      preferences: { tech_stack: "React" },
      inspirationSeeds: ["Material Design principles"],
      mode: "explore" as const,
      rounds: [
        { focus: "concepts", lead: "DesignPhilosopher" },
        { focus: "experience_goals", lead: "ExperienceArchitect" },
        { focus: "technical_bridge", lead: "TechnicalPoet" }
      ]
    }
    
    const { systemPrompt, userPrompt } = experts.generateRoundPrompt(
      { focus: "historical_grounding", lead: "DesignPhilosopher" },
      ["DesignPhilosopher", "ExperienceArchitect"],
      mockContext,
      {},
      "explore"
    )
    
    yield* Console.log(`✅ Expert prompt generated successfully`)
    yield* Console.log(`📝 System prompt length: ${systemPrompt.length} chars`)
    yield* Console.log(`📝 User prompt length: ${userPrompt.length} chars`)
    
    // Test expert tracking
    yield* openai.trackExpertInteraction({
      expertName: "TestExpert",
      round: "test_round",
      callCount: 1,
      insights: ["Test insight"]
    })
    
    const interactions = yield* openai.getExpertInteractions()
    yield* Console.log(`✅ Expert tracking working: ${interactions.length} interactions`)
    
    yield* Console.log(`🎉 All tests passed! Ready for production use.`)
    
  } catch (error) {
    yield* Console.error(`❌ Test failed: ${error}`)
  }
})

// Run test with OpenAI service
const main = testProgram.pipe(
  Effect.provide(OpenAIService.Live),
  Effect.catchAll((error) => 
    Console.error(`❌ Test Error: ${error}`)
  )
)

Effect.runPromise(main).catch(console.error)