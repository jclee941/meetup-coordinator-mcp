import { describe, expect, test } from "bun:test"
import { LATEST_PROTOCOL_VERSION } from "@modelcontextprotocol/sdk/types.js"
import { z } from "zod"

import { loadConfig } from "../src/config.js"
import { createHttpApp } from "../src/http-server.js"

const toolSchema = z
  .object({
    inputSchema: z.object({}).passthrough(),
    name: z.string(),
    outputSchema: z.object({}).passthrough().optional(),
  })
  .passthrough()

const toolsListResponseSchema = z.object({
  result: z.object({
    tools: z.array(toolSchema),
  }),
})

const availabilityResponseSchema = z.object({
  result: z.object({
    structuredContent: z.object({
      availableDates: z.array(z.string()),
      summary: z.string(),
    }),
  }),
})

describe("HTTP MCP transport", () => {
  test("lists meetup coordinator tools through Streamable HTTP", async () => {
    const server = createHttpApp(loadConfig({ PORT: "3222" }))

    try {
      await initializeMcpSession()
      const tools = await postMcpRequest({
        id: 2,
        method: "tools/list",
        params: {},
      })
      const parsed = toolsListResponseSchema.parse(tools)

      expect(
        findTool(parsed.result.tools, "meetup_availability_extract")?.outputSchema,
      ).toBeDefined()
      expect(findTool(parsed.result.tools, "meetup_option_rank")?.outputSchema).toBeDefined()
      expect(findTool(parsed.result.tools, "meetup_poll_draft")?.outputSchema).toBeDefined()
      expect(findTool(parsed.result.tools, "meetup_final_notice")?.outputSchema).toBeDefined()
      expect(findTool(parsed.result.tools, "meetup_missing_people")?.outputSchema).toBeDefined()
      expect(findTool(parsed.result.tools, "meetup_split_bill_message")?.outputSchema).toBeDefined()
      expect(parsed.result.tools).toHaveLength(6)
    } finally {
      server.stop(true)
    }
  })

  test("calls availability extraction through Streamable HTTP", async () => {
    const server = createHttpApp(loadConfig({ PORT: "3222" }))

    try {
      await initializeMcpSession()
      const result = await postMcpRequest({
        id: 3,
        method: "tools/call",
        params: {
          name: "meetup_availability_extract",
          arguments: {
            messages: ["민지: 금요일 좋아", "도윤: 토요일은 안 돼", "서연: 강남이면 가능"],
            topic: "저녁 약속",
          },
        },
      })
      const parsed = availabilityResponseSchema.parse(result)

      expect(parsed.result.structuredContent.availableDates).toContain("금요일")
      expect(parsed.result.structuredContent.summary).toContain("금요일")
    } finally {
      server.stop(true)
    }
  })
})

function findTool(
  tools: readonly z.infer<typeof toolSchema>[],
  name: string,
): z.infer<typeof toolSchema> | undefined {
  return tools.find((tool) => tool.name === name)
}

async function initializeMcpSession(): Promise<void> {
  await postMcpRequest({
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: LATEST_PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: {
        name: "meetup-http-smoke",
        version: "0.1.0",
      },
    },
  })
  await postMcpNotification({
    method: "notifications/initialized",
  })
}

async function postMcpRequest(body: Record<string, unknown>): Promise<unknown> {
  const response = await fetch("http://localhost:3222/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      ...body,
    }),
  })

  expect(response.status).toBe(200)
  return response.json()
}

async function postMcpNotification(body: Record<string, unknown>): Promise<void> {
  const response = await fetch("http://localhost:3222/mcp", {
    method: "POST",
    headers: {
      accept: "application/json, text/event-stream",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      ...body,
    }),
  })

  expect(response.status).toBe(202)
}
