import { confirm, input } from "@inquirer/prompts"
import chalk from "chalk"
import { Context, Effect, Layer } from "effect"

export class CLIService extends Context.Tag("CLIService")<
  CLIService,
  {
    askInitialPrompt: () => Effect.Effect<string, Error>
    askQuestions: (questions: string[]) => Effect.Effect<any, Error>
    getUserFeedback: (focus: string, current: string) => Effect.Effect<string | null, Error>
  }
>() {
  static Live = Layer.succeed(
    CLIService,
    {
      askInitialPrompt: () =>
        Effect.tryPromise({
          try: async () => {
            console.log(chalk.cyan("\n🎨 Creative AI Loop - Deep Design Through Expert Collaboration\n"))
            return await input({
              message: "What would you like to create?",
              default: ""
            })
          },
          catch: (error) => new Error(`Failed to get input: ${error}`)
        }),

      askQuestions: (questions: string[]) =>
        Effect.gen(function*() {
          const responses: any = {
            constraints: {},
            preferences: {}
          }

          for (const question of questions) {
            const answer = yield* Effect.tryPromise({
              try: () => input({ message: question }),
              catch: (error) => new Error(`Failed to get input: ${error}`)
            })

            // Parse responses into constraints or preferences
            if (question.includes("production")) {
              responses.constraints.environment = answer
            } else if (question.includes("emotional tone")) {
              responses.preferences.tone = answer
            } else if (question.includes("scale")) {
              responses.constraints.scale = answer
            } else if (question.includes("technology stack")) {
              responses.preferences.tech_stack = answer
            }
          }

          return responses
        }),

      getUserFeedback: (focus: string, current: string) =>
        Effect.gen(function*() {
          console.log(chalk.yellow(`\n📝 Current ${focus}:`))
          console.log(chalk.gray(current))

          const shouldEdit = yield* Effect.tryPromise({
            try: () =>
              confirm({
                message: `Would you like to refine the ${focus}?`,
                default: false
              }),
            catch: (error) => new Error(`Failed to get confirmation: ${error}`)
          })

          if (shouldEdit) {
            return yield* Effect.tryPromise({
              try: () =>
                input({
                  message: `Enter your refined ${focus}:`,
                  default: current
                }),
              catch: (error) => new Error(`Failed to get input: ${error}`)
            })
          }

          return null
        })
    }
  )
}

export namespace CLIService {
  export interface Service {
    askInitialPrompt: () => Effect.Effect<string, Error>
    askQuestions: (questions: string[]) => Effect.Effect<any, Error>
    getUserFeedback: (focus: string, current: string) => Effect.Effect<string | null, Error>
  }
}
