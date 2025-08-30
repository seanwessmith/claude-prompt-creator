#!/usr/bin/env bun

import { Effect, Console, pipe, Exit, Cause, Runtime, Scope } from "effect"
import { CreativeAILoop } from "./core/CreativeAILoop"
import { OpenAIService } from "./services/OpenAIService"
import { MemoryService } from "./services/MemoryService"
import { CLIService } from "./services/CLIService"
import { FileService } from "./services/FileService"
import chalk from "chalk"

const program = Effect.gen(function* () {
  const cli = yield* CLIService
  const loop = yield* CreativeAILoop
  
  const initialPrompt = yield* cli.askInitialPrompt()
  
  yield* Console.log(chalk.cyan("🎨 Starting Creative AI Loop..."))
  const result = yield* loop.run(initialPrompt)
  
  yield* Console.log(chalk.green(`\n✨ Output saved to: ${result.outputPath}`))
  return result
})

const main = pipe(
  program,
  Effect.provide(CreativeAILoop.Live),
  Effect.provide(OpenAIService.Live),
  Effect.provide(MemoryService.Live),
  Effect.provide(CLIService.Live),
  Effect.provide(FileService.Live),
  Effect.scoped,
  Effect.catchAll((error) => 
    Console.error(`❌ Error: ${error}`).pipe(
      Effect.zipRight(Effect.fail(error))
    )
  )
)

Effect.runPromise(main).catch(console.error)