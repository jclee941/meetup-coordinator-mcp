import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

import { loadConfig } from "./config.js"
import { createMeetupMcpServer } from "./mcp/server.js"

const server = createMeetupMcpServer(loadConfig(Bun.env))
const transport = new StdioServerTransport()

await server.connect(transport)
