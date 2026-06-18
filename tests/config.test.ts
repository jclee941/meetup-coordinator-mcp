import { describe, expect, test } from "bun:test"

import { loadConfig } from "../src/config.js"

describe("loadConfig", () => {
  test("returns defaults when optional environment values are absent", () => {
    const config = loadConfig({})

    expect(config.PORT).toBe(3000)
    expect(config.MCP_SERVER_NAME).toBe("meetup-coordinator-mcp")
    expect(config.MCP_SERVER_VERSION).toBe("0.1.0")
  })

  test("rejects invalid port values", () => {
    expect(() => loadConfig({ PORT: "99999" })).toThrow()
  })
})
