import { z } from "zod"

const ConfigSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MCP_SERVER_NAME: z.string().min(1).default("meetup-coordinator-mcp"),
  MCP_SERVER_VERSION: z.string().min(1).default("0.1.0"),
  PUBLIC_BASE_URL: z.url().default("http://localhost:3000"),
})

export type AppConfig = z.infer<typeof ConfigSchema>

export function loadConfig(env: Record<string, string | undefined>): AppConfig {
  return ConfigSchema.parse(env)
}
