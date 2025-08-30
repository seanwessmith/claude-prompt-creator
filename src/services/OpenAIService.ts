import { Config, Context, Effect, Layer } from "effect"
import OpenAI from "openai"

export interface ExpertInteraction {
  expertName: string
  round: string
  callCount: number
  insights: string[]
  responseId?: string
}

export interface OpenAIConfig {
  model: string
  reasoningEffort: "low" | "medium" | "high"
  verbosity: "low" | "medium" | "high"
  temperature?: number
}

export class OpenAIService extends Context.Tag("OpenAIService")<
  OpenAIService,
  {
    generateResponse: (
      prompt: string,
      config?: Partial<OpenAIConfig>,
      previousResponseId?: string
    ) => Effect.Effect<{ content: string; responseId?: string }, Error>

    trackExpertInteraction: (interaction: ExpertInteraction) => Effect.Effect<void>
    getExpertInteractions: () => Effect.Effect<ExpertInteraction[]>
  }
>() {
  static Live = Layer.effect(
    OpenAIService,
    Effect.gen(function*() {
      const apiKey = yield* Config.string("OPENAI_API_KEY").pipe(
        Config.withDefault(process.env.OPENAI_API_KEY || "")
      )

      if (!apiKey) {
        return yield* Effect.fail(
          new Error("OPENAI_API_KEY environment variable is required")
        )
      }

      const client = new OpenAI({ apiKey })
      const expertInteractions: ExpertInteraction[] = []

      const defaultConfig: OpenAIConfig = {
        model: "gpt-5",
        reasoningEffort: "high",
        verbosity: "medium",
        temperature: 1
      }

      return {
        generateResponse: (
          prompt: string,
          config: Partial<OpenAIConfig> = {},
          previousResponseId?: string
        ) =>
          Effect.tryPromise({
            try: async () => {
              const finalConfig = { ...defaultConfig, ...config }

              // Use Responses API for better reasoning persistence
              const requestBody: any = {
                model: finalConfig.model,
                reasoning_effort: finalConfig.reasoningEffort,
                verbosity: finalConfig.verbosity,
                temperature: finalConfig.temperature,
                messages: [
                  {
                    role: "user",
                    content: prompt
                  }
                ]
              }

              // Include previous response ID for context persistence
              if (previousResponseId) {
                requestBody.previous_response_id = previousResponseId
              }

              const response = await client.chat.completions.create(requestBody)

              const content = response.choices[0]?.message?.content
              if (!content) {
                throw new Error("No content in OpenAI response")
              }

              // Extract response ID if using Responses API
              const responseId = (response as any).response_id

              return {
                content,
                responseId
              }
            },
            catch: (error) => new Error(`OpenAI API error: ${error}`)
          }),

        trackExpertInteraction: (interaction: ExpertInteraction) =>
          Effect.sync(() => {
            const existing = expertInteractions.find(
              (i) => i.expertName === interaction.expertName && i.round === interaction.round
            )

            if (existing) {
              existing.callCount += interaction.callCount
              existing.insights.push(...interaction.insights)
              if (interaction.responseId) {
                existing.responseId = interaction.responseId
              }
            } else {
              expertInteractions.push({ ...interaction })
            }
          }),

        getExpertInteractions: () => Effect.succeed([...expertInteractions])
      }
    })
  )
}

export namespace OpenAIService {
  export interface Service {
    generateResponse: (
      prompt: string,
      config?: Partial<OpenAIConfig>,
      previousResponseId?: string
    ) => Effect.Effect<{ content: string; responseId?: string }, Error>

    trackExpertInteraction: (interaction: ExpertInteraction) => Effect.Effect<void>
    getExpertInteractions: () => Effect.Effect<ExpertInteraction[]>
  }
}
