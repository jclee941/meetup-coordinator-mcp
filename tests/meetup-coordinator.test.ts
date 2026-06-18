import { describe, expect, test } from "bun:test"

import {
  draftFinalNotice,
  draftPoll,
  extractAvailability,
  findMissingPeople,
  rankMeetupOptions,
  writeSplitBillMessage,
} from "../src/mcp/meetup-coordinator.js"

describe("meetup coordinator domain", () => {
  test("extracts availability from group chat messages", () => {
    const result = extractAvailability({
      messages: [
        "민지: 금요일 좋아",
        "도윤: 토요일은 안 돼",
        "서연: 강남이면 가능",
        "준호: 금요일 저녁 가능",
      ],
      topic: "저녁 약속",
    })

    expect(result.availableDates).toContain("금요일")
    expect(result.unavailableDates).toContain("토요일")
    expect(result.placeSignals).toContain("강남")
    expect(result.summary).toContain("금요일")
  })

  test("ranks meetup options by conflicts and place signals", () => {
    const result = rankMeetupOptions({
      candidates: [
        { date: "금요일", place: "강남" },
        { date: "토요일", place: "홍대" },
      ],
      messages: ["민지: 금요일 좋아", "도윤: 토요일은 안 돼", "서연: 강남이면 가능"],
    })

    expect(result.rankedOptions[0]?.date).toBe("금요일")
    expect(result.rankedOptions[0]?.place).toBe("강남")
    expect(result.rankedOptions[0]?.score).toBeGreaterThan(result.rankedOptions[1]?.score ?? 0)
  })

  test("drafts a KakaoTalk poll with concise options", () => {
    const result = draftPoll({
      options: ["금요일 강남", "토요일 홍대"],
      topic: "저녁 약속",
    })

    expect(result.title).toContain("저녁 약속")
    expect(result.message).toContain("가능한 쪽")
    expect(result.options).toHaveLength(2)
  })

  test("drafts final notice with time place and preparation notes", () => {
    const result = draftFinalNotice({
      date: "금요일",
      place: "강남역 10번 출구",
      time: "저녁 7시",
      topic: "저녁 약속",
    })

    expect(result.notice).toContain("금요일")
    expect(result.notice).toContain("강남역 10번 출구")
    expect(result.checklist).toContain("늦거나 못 오면 단체방에 바로 알려주세요.")
  })

  test("finds missing or ambiguous responders", () => {
    const result = findMissingPeople({
      expectedPeople: ["민지", "도윤", "서연", "준호"],
      messages: ["민지: 금요일 좋아", "도윤: 난 아무거나", "서연: 강남이면 가능"],
    })

    expect(result.missingPeople).toContain("준호")
    expect(result.ambiguousPeople).toContain("도윤")
    expect(result.followUpAsk).toContain("준호")
  })

  test("writes a split bill message from total and participants", () => {
    const result = writeSplitBillMessage({
      participants: ["민지", "도윤", "서연"],
      totalAmount: 45000,
      payer: "민지",
    })

    expect(result.perPersonAmount).toBe(15000)
    expect(result.message).toContain("1인당 15,000원")
  })
})
