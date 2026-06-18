import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js"

import { loadConfig } from "./config.js"
import { createMeetupMcpServer } from "./mcp/server.js"

export function createHttpApp(config = loadConfig(Bun.env)): Bun.Server<undefined> {
  return Bun.serve({
    hostname: "0.0.0.0",
    port: config.PORT,
    async fetch(request) {
      const url = new URL(request.url)

      if (url.pathname === "/") {
        return Response.json({
          name: config.MCP_SERVER_NAME,
          version: config.MCP_SERVER_VERSION,
          endpoints: {
            health: "/health",
            mcp: "/mcp",
          },
        })
      }

      if (url.pathname === "/health") {
        return Response.json({
          status: "ok",
          service: config.MCP_SERVER_NAME,
        })
      }

      if (url.pathname === "/mcp") {
        const server = createMeetupMcpServer(config)
        const transport = new WebStandardStreamableHTTPServerTransport({
          enableJsonResponse: true,
        })

        await server.connect(transport)
        const response = await transport.handleRequest(request)
        await transport.close()
        await server.close()
        return response
      }

      return Response.json({ error: "not_found" }, { status: 404 })
    },
  })
}

if (import.meta.main) {
  createHttpApp()
}
