import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"

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
        "Extract available dates, blocked dates, and place signals from Korean group chat.",
      inputSchema: meetupAvailabilityInputSchema,
      outputSchema: meetupAvailabilityOutputSchema,
    },
    ({ messages, topic }) => {
      const result = extractAvailability({ messages, topic })
      return formatToolResult("약속 가능 시간 추출", result)
    },
  )

  server.registerTool(
    "meetup_option_rank",
    {
      title: "Meetup Option Rank",
      description: "Rank date/place options by conflicts and preference signals in a group chat.",
      inputSchema: meetupOptionRankInputSchema,
      outputSchema: meetupOptionRankOutputSchema,
    },
    ({ candidates, messages }) => {
      const result = rankMeetupOptions({ candidates, messages })
      return formatToolResult("약속 후보 순위", result)
    },
  )

  server.registerTool(
    "meetup_poll_draft",
    {
      title: "Meetup Poll Draft",
      description: "Draft a concise KakaoTalk poll for deciding meetup options.",
      inputSchema: meetupPollDraftInputSchema,
      outputSchema: meetupPollDraftOutputSchema,
    },
    ({ options, topic }) => {
      const result = draftPoll({ options, topic })
      return formatToolResult("카톡 투표 문구", result)
    },
  )

  server.registerTool(
    "meetup_final_notice",
    {
      title: "Meetup Final Notice",
      description: "Draft the final KakaoTalk notice after a meetup date and place are decided.",
      inputSchema: meetupFinalNoticeInputSchema,
      outputSchema: meetupFinalNoticeOutputSchema,
    },
    ({ date, place, time, topic }) => {
      const result = draftFinalNotice({ date, place, time, topic })
      return formatToolResult("약속 확정 공지", result)
    },
  )

  server.registerTool(
    "meetup_missing_people",
    {
      title: "Meetup Missing People",
      description: "Find people who did not answer or answered ambiguously in a group chat.",
      inputSchema: meetupMissingPeopleInputSchema,
      outputSchema: meetupMissingPeopleOutputSchema,
    },
    ({ expectedPeople, messages }) => {
      const result = findMissingPeople({ expectedPeople, messages })
      return formatToolResult("미응답자 정리", result)
    },
  )

  server.registerTool(
    "meetup_split_bill_message",
    {
      title: "Meetup Split Bill Message",
      description: "Create a polite Korean split-bill message from total amount and participants.",
      inputSchema: meetupSplitBillInputSchema,
      outputSchema: meetupSplitBillOutputSchema,
    },
    ({ participants, payer, totalAmount }) => {
      const result = writeSplitBillMessage({ participants, payer, totalAmount })
      return formatToolResult("정산 안내 문구", result)
    },
  )

  return server
}

function formatToolResult<T extends object>(title: string, value: T) {
  return {
    content: [
      {
        type: "text" as const,
        text: `${title}\n\n${JSON.stringify(value, null, 2)}`,
      },
    ],
    structuredContent: value,
  }
}
