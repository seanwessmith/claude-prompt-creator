import Anthropic from "@anthropic-ai/sdk"
import { Config, Context, Effect, Layer } from "effect"

export class AnthropicService extends Context.Tag("AnthropicService")<
  AnthropicService,
  {
    generateCompletion: (prompt: string) => Effect.Effect<string, Error>
  }
>() {
  static Live = Layer.effect(
    AnthropicService,
    Effect.gen(function*() {
      const apiKey = yield* Config.string("ANTHROPIC_API_KEY").pipe(
        Config.withDefault(process.env.ANTHROPIC_API_KEY || "")
      )

      if (!apiKey) {
        return yield* Effect.fail(
          new Error("ANTHROPIC_API_KEY environment variable is required")
        )
      }

      const client = new Anthropic({ apiKey })

      return {
        generateCompletion: (prompt: string) =>
          Effect.tryPromise({
            try: async () => {
              const response = await client.messages.create({
                model: "claude-opus-4-1-20250805",
                max_tokens: 4000,
                messages: [
                  {
                    role: "user",
                    content: prompt
                  }
                ]
              })

              const content = response.content[0]
              if (content.type === "text") {
                return content.text
              }
              throw new Error("Unexpected response type")
            },
            catch: (error) => new Error(`Anthropic API error: ${error}`)
          })
      }
    })
  )
}

export namespace AnthropicService {
  export interface Service {
    generateCompletion: (prompt: string) => Effect.Effect<string, Error>
  }
}
