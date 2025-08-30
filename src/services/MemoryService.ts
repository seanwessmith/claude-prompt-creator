import { Effect, Context, Layer } from "effect"
import sqlite3 from "sqlite3"
import path from "path"
import type { Philosophy, TechnicalSpec } from "../core/CreativeAILoop"

interface MemoryEntry {
  task: string
  philosophy: Philosophy
  spec: TechnicalSpec
  timestamp: Date
}

export class MemoryService extends Context.Tag("MemoryService")<
  MemoryService,
  {
    findRelevantSuccesses: (task: string) => Effect.Effect<string[], Error>
    storeSuccess: (task: string, philosophy: Philosophy, spec: TechnicalSpec) => Effect.Effect<void, Error>
    getSessionMemory: () => Effect.Effect<MemoryEntry[], Error>
  }
>() {
  static Live = Layer.effect(
    MemoryService,
    Effect.gen(function* () {
      // Session memory (in-memory)
      const sessionMemory: MemoryEntry[] = []
      
      // Historical memory (SQLite)
      const dbPath = path.join(process.cwd(), "creative_ai_memory.db")
      
      const db = yield* Effect.acquireRelease(
        Effect.sync(() => {
          const database = new sqlite3.Database(dbPath)
          
          // Initialize database schema
          database.run(`
            CREATE TABLE IF NOT EXISTS memories (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              task TEXT NOT NULL,
              philosophy TEXT NOT NULL,
              spec TEXT NOT NULL,
              timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )
          `)
          
          return database
        }),
        (database) => Effect.sync(() => database.close())
      )
      
      return {
        findRelevantSuccesses: (task: string) =>
          Effect.tryPromise({
            try: () =>
              new Promise<string[]>((resolve, reject) => {
                // Simple keyword matching for MVP
                const keywords = task.toLowerCase().split(" ").filter(w => w.length > 3)
                const query = `
                  SELECT task, philosophy FROM memories 
                  WHERE ${keywords.map(() => "LOWER(task) LIKE ?").join(" OR ")}
                  ORDER BY timestamp DESC
                  LIMIT 3
                `
                const params = keywords.map(k => `%${k}%`)
                
                db.all(query, params, (err, rows: any[]) => {
                  if (err) reject(err)
                  else resolve(rows.map(r => `${r.task}: ${JSON.parse(r.philosophy).historicalGrounding || ''}`))
                })
              }),
            catch: (error) => new Error(`Failed to query memories: ${error}`),
          }),
        
        storeSuccess: (task: string, philosophy: Philosophy, spec: TechnicalSpec) =>
          Effect.gen(function* () {
            // Store in session memory
            sessionMemory.push({
              task,
              philosophy,
              spec,
              timestamp: new Date(),
            })
            
            // Store in historical memory
            yield* Effect.tryPromise({
              try: () =>
                new Promise<void>((resolve, reject) => {
                  db.run(
                    "INSERT INTO memories (task, philosophy, spec) VALUES (?, ?, ?)",
                    [task, JSON.stringify(philosophy), JSON.stringify(spec)],
                    (err) => {
                      if (err) reject(err)
                      else resolve()
                    }
                  )
                }),
              catch: (error) => new Error(`Failed to store memory: ${error}`),
            })
          }),
        
        getSessionMemory: () => Effect.succeed(sessionMemory),
      }
    })
  )
}

export namespace MemoryService {
  export interface Service {
    findRelevantSuccesses: (task: string) => Effect.Effect<string[], Error>
    storeSuccess: (task: string, philosophy: Philosophy, spec: TechnicalSpec) => Effect.Effect<void, Error>
    getSessionMemory: () => Effect.Effect<MemoryEntry[], Error>
  }
}