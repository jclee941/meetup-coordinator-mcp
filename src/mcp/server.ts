import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js"

import type { AppConfig } from "../config.js"
import {
  draftFinalNotice,
  draftPoll,
  extractAvailability,
  findMissingPeople,
  rankMeetupOptions,
  writeSplitBillMessage,
} from "./meetup-coordinator.js"
import {
  meetupAvailabilityInputSchema,
  meetupAvailabilityOutputSchema,
  meetupFinalNoticeInputSchema,
  meetupFinalNoticeOutputSchema,
  meetupMissingPeopleInputSchema,
  meetupMissingPeopleOutputSchema,
  meetupOptionRankInputSchema,
  meetupOptionRankOutputSchema,
  meetupPollDraftInputSchema,
  meetupPollDraftOutputSchema,
  meetupSplitBillInputSchema,
  meetupSplitBillOutputSchema,
} from "./meetup-schemas.js"

export function createMeetupMcpServer(config: AppConfig): McpServer {
  const server = new McpServer({
    name: config.MCP_SERVER_NAME,
    version: config.MCP_SERVER_VERSION,
  })

  server.registerTool(
    "meetup_availability_extract",
    {
      title: "Meetup Availability Extract",
      description:
        "Meetup Coordinator MCP(밋업 코디네이터 MCP) extracts available dates, blocked dates, and place signals only when the user provides a short pasted group chat excerpt.",
      inputSchema: meetupAvailabilityInputSchema,
      outputSchema: meetupAvailabilityOutputSchema,
      annotations: readOnlyAnnotations("Meetup Availability Extract"),
    },
    ({ messages, topic }) => {
      const result = extractAvailability({ messages, topic })
      return formatToolResult("약속 가능 시간 추출", result, result.summary)
    },
  )

  server.registerTool(
    "meetup_option_rank",
    {
      title: "Meetup Option Rank",
      description:
        "Meetup Coordinator MCP(밋업 코디네이터 MCP) ranks provided meetup date and place candidates. Chat text is optional and should not be requested when candidates are already provided.",
      inputSchema: meetupOptionRankInputSchema,
      outputSchema: meetupOptionRankOutputSchema,
      annotations: readOnlyAnnotations("Meetup Option Rank"),
    },
    ({ candidates, messages }) => {
      const result = rankMeetupOptions({ candidates, messages: messages ?? [] })
      return formatToolResult("약속 후보 순위", result, result.recommendation)
    },
  )

  server.registerTool(
    "meetup_poll_draft",
    {
      title: "Meetup Poll Draft",
      description:
        "Meetup Coordinator MCP(밋업 코디네이터 MCP) drafts a concise Korean group chat poll from a topic and options. It does not require chat history.",
      inputSchema: meetupPollDraftInputSchema,
      outputSchema: meetupPollDraftOutputSchema,
      annotations: readOnlyAnnotations("Meetup Poll Draft"),
    },
    ({ options, topic }) => {
      const result = draftPoll({ options, topic })
      return formatToolResult("투표 문구", result, result.message)
    },
  )

  server.registerTool(
    "meetup_final_notice",
    {
      title: "Meetup Final Notice",
      description:
        "Meetup Coordinator MCP(밋업 코디네이터 MCP) drafts the final Korean group chat notice from confirmed topic, date, time, and place. It does not require chat history.",
      inputSchema: meetupFinalNoticeInputSchema,
      outputSchema: meetupFinalNoticeOutputSchema,
      annotations: readOnlyAnnotations("Meetup Final Notice"),
    },
    ({ date, place, time, topic }) => {
      const result = draftFinalNotice({ date, place, time, topic })
      return formatToolResult("약속 확정 공지", result, result.notice)
    },
  )

  server.registerTool(
    "meetup_missing_people",
    {
      title: "Meetup Missing People",
      description:
        "Meetup Coordinator MCP(밋업 코디네이터 MCP) checks expected people against an optional pasted chat excerpt. If no excerpt is provided, it prepares a follow-up for all expected people.",
      inputSchema: meetupMissingPeopleInputSchema,
      outputSchema: meetupMissingPeopleOutputSchema,
      annotations: readOnlyAnnotations("Meetup Missing People"),
    },
    ({ expectedPeople, messages }) => {
      const result = findMissingPeople({ expectedPeople, messages: messages ?? [] })
      return formatToolResult("미응답자 정리", result, result.followUpAsk)
    },
  )

  server.registerTool(
    "meetup_split_bill_message",
    {
      title: "Meetup Split Bill Message",
      description:
        "Meetup Coordinator MCP(밋업 코디네이터 MCP) creates a polite Korean split-bill message from total amount, participants, and payer. It does not require chat history.",
      inputSchema: meetupSplitBillInputSchema,
      outputSchema: meetupSplitBillOutputSchema,
      annotations: readOnlyAnnotations("Meetup Split Bill Message"),
    },
    ({ participants, payer, totalAmount }) => {
      const result = writeSplitBillMessage({ participants, payer, totalAmount })
      return formatToolResult("정산 안내 문구", result, result.message)
    },
  )

  return server
}

function readOnlyAnnotations(title: string): ToolAnnotations {
  return {
    title,
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  }
}

function formatToolResult<T extends object>(title: string, value: T, summary: string) {
  return {
    content: [
      {
        type: "text" as const,
        text: `## ${title}\n\n${summary}`,
      },
    ],
    structuredContent: value,
  }
}
