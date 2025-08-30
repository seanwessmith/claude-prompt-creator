import { Effect, Context, Layer } from "effect"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export class FileService extends Context.Tag("FileService")<
  FileService,
  {
    saveOutput: (taskName: string, content: string) => Effect.Effect<string, Error>
  }
>() {
  static Live = Layer.succeed(
    FileService,
    {
      saveOutput: (taskName: string, content: string) =>
        Effect.gen(function* () {
          const outputDir = path.join(process.cwd(), "output")
          
          // Create output directory if it doesn't exist
          yield* Effect.tryPromise({
            try: () => mkdir(outputDir, { recursive: true }),
            catch: (error) => new Error(`Failed to create output directory: ${error}`),
          })
          
          // Generate filename from task name
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
          const sanitizedTaskName = taskName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")
            .slice(0, 50)
          const filename = `${sanitizedTaskName}_${timestamp}.md`
          const filepath = path.join(outputDir, filename)
          
          // Write the file
          yield* Effect.tryPromise({
            try: () => writeFile(filepath, content, "utf-8"),
            catch: (error) => new Error(`Failed to write output file: ${error}`),
          })
          
          return filepath
        }),
    }
  )
}

export namespace FileService {
  export interface Service {
    saveOutput: (taskName: string, content: string) => Effect.Effect<string, Error>
  }
}