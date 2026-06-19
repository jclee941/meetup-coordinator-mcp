export type MeetupMessagesInput = {
  readonly messages: readonly string[]
  readonly topic: string
}

export type MeetupAvailability = {
  readonly topic: string
  readonly availableDates: readonly string[]
  readonly unavailableDates: readonly string[]
  readonly placeSignals: readonly string[]
  readonly summary: string
}

export type MeetupCandidate = {
  readonly date: string
  readonly place: string
}

export type MeetupRankInput = {
  readonly candidates: readonly MeetupCandidate[]
  readonly messages: readonly string[]
}

export type RankedMeetupOption = MeetupCandidate & {
  readonly score: number
  readonly reasons: readonly string[]
}

export type MeetupRankResult = {
  readonly rankedOptions: readonly RankedMeetupOption[]
  readonly recommendation: string
}

export type MeetupPollInput = {
  readonly topic: string
  readonly options: readonly string[]
}

export type MeetupPollDraft = {
  readonly title: string
  readonly message: string
  readonly options: readonly string[]
}

export type MeetupFinalNoticeInput = {
  readonly topic: string
  readonly date: string
  readonly time: string
  readonly place: string
}

export type MeetupFinalNotice = {
  readonly notice: string
  readonly checklist: readonly string[]
}

export type MeetupMissingPeopleInput = {
  readonly expectedPeople: readonly string[]
  readonly messages: readonly string[]
}

export type MeetupMissingPeople = {
  readonly missingPeople: readonly string[]
  readonly ambiguousPeople: readonly string[]
  readonly followUpAsk: string
}

export type SplitBillInput = {
  readonly totalAmount: number
  readonly participants: readonly string[]
  readonly payer: string
}

export type SplitBillMessage = {
  readonly perPersonAmount: number
  readonly message: string
  readonly caution: readonly string[]
}

const knownDates = [
  "월요일",
  "화요일",
  "수요일",
  "목요일",
  "금요일",
  "토요일",
  "일요일",
  "오늘",
  "내일",
] as const
const knownPlaces = [
  "강남",
  "홍대",
  "성수",
  "잠실",
  "합정",
  "신촌",
  "건대",
  "종로",
  "여의도",
] as const

export function extractAvailability(input: MeetupMessagesInput): MeetupAvailability {
  const availableDates = collectSignals(input.messages, knownDates, ["좋아", "가능", "괜찮"])
  const unavailableDates = collectSignals(input.messages, knownDates, [
    "안 돼",
    "안되",
    "불가",
    "어려",
  ])
  const placeSignals = collectMentions(input.messages, knownPlaces)

  return {
    topic: input.topic,
    availableDates,
    unavailableDates,
    placeSignals,
    summary: `${input.topic}은 ${formatList(availableDates)} 가능성이 높고, ${formatList(unavailableDates)}은 피하는 편이 안전합니다.`,
  }
}

export function rankMeetupOptions(input: MeetupRankInput): MeetupRankResult {
  const availability = extractAvailability({ messages: input.messages, topic: "약속" })
  const rankedOptions = input.candidates
    .map((candidate) => scoreCandidate(candidate, availability))
    .sort((left, right) => right.score - left.score)

  const best = rankedOptions[0]
  const hasChatSignals = input.messages.length > 0

  return {
    rankedOptions,
    recommendation:
      best === undefined
        ? "후보가 없어 날짜와 장소를 먼저 2개씩 받아야 합니다."
        : hasChatSignals
          ? `${best.date} ${best.place}가 현재 대화 기준으로 가장 충돌이 적습니다.`
          : "대화 신호가 없어 입력된 후보 순서를 유지했습니다. 후보가 정해졌다면 바로 투표 문구를 만들 수 있습니다.",
  }
}

export function draftPoll(input: MeetupPollInput): MeetupPollDraft {
  return {
    title: `${input.topic} 투표`,
    message: `${input.topic} 가능한 쪽에 투표해줘. 애매하면 댓글로 안 되는 조건만 남겨줘.`,
    options: input.options,
  }
}

export function draftFinalNotice(input: MeetupFinalNoticeInput): MeetupFinalNotice {
  return {
    notice: `${input.topic} 확정입니다. ${input.date} ${input.time}, 장소는 ${input.place}입니다.`,
    checklist: [
      "늦거나 못 오면 단체방에 바로 알려주세요.",
      "장소 변경이 필요하면 출발 전까지 말해주세요.",
      "정산이 있으면 결제자와 금액을 확인해주세요.",
    ],
  }
}

export function findMissingPeople(input: MeetupMissingPeopleInput): MeetupMissingPeople {
  const responders = input.expectedPeople.filter((person) =>
    input.messages.some((message) => message.startsWith(`${person}:`)),
  )
  const missingPeople = input.expectedPeople.filter((person) => !responders.includes(person))
  const ambiguousPeople = input.expectedPeople.filter((person) =>
    input.messages.some(
      (message) =>
        message.startsWith(`${person}:`) &&
        (message.includes("아무거나") || message.includes("상관없") || message.includes("몰라")),
    ),
  )

  return {
    missingPeople,
    ambiguousPeople,
    followUpAsk: buildFollowUpAsk(missingPeople, ambiguousPeople),
  }
}

export function writeSplitBillMessage(input: SplitBillInput): SplitBillMessage {
  const perPersonAmount = Math.ceil(input.totalAmount / input.participants.length)

  return {
    perPersonAmount,
    message: `${input.payer}가 결제했고 총 ${formatWon(input.totalAmount)}입니다. ${input.participants.length}명 기준 1인당 ${formatWon(perPersonAmount)} 보내주세요.`,
    caution: [
      "참석자 수가 바뀌었으면 다시 계산하세요.",
      "카드 할인이나 선결제 제외 금액이 있으면 먼저 빼고 계산하세요.",
    ],
  }
}

function collectSignals(
  messages: readonly string[],
  terms: readonly string[],
  positiveWords: readonly string[],
): readonly string[] {
  return unique(
    terms.filter((term) =>
      messages.some(
        (message) => message.includes(term) && positiveWords.some((word) => message.includes(word)),
      ),
    ),
  )
}

function collectMentions(messages: readonly string[], terms: readonly string[]): readonly string[] {
  return unique(terms.filter((term) => messages.some((message) => message.includes(term))))
}

function scoreCandidate(
  candidate: MeetupCandidate,
  availability: MeetupAvailability,
): RankedMeetupOption {
  const datePositive = availability.availableDates.includes(candidate.date)
  const dateNegative = availability.unavailableDates.includes(candidate.date)
  const placePositive = availability.placeSignals.includes(candidate.place)
  const score = (datePositive ? 3 : 0) + (placePositive ? 2 : 0) - (dateNegative ? 4 : 0)

  return {
    ...candidate,
    score,
    reasons: [
      datePositive ? `${candidate.date} 가능 신호 있음` : `${candidate.date} 가능 신호 부족`,
      placePositive ? `${candidate.place} 장소 선호 신호 있음` : `${candidate.place} 언급 부족`,
      dateNegative ? `${candidate.date} 불가 신호 있음` : "명확한 불가 신호 없음",
    ],
  }
}

function buildFollowUpAsk(
  missingPeople: readonly string[],
  ambiguousPeople: readonly string[],
): string {
  if (missingPeople.length > 0) {
    return `${formatList(missingPeople)} 가능 여부만 한 번 확인해줘.`
  }
  if (ambiguousPeople.length > 0) {
    return `${formatList(ambiguousPeople)}는 가능한 날짜를 하나만 골라줘.`
  }
  return "모두 응답했으니 후보를 확정해도 됩니다."
}

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)]
}

function formatList(values: readonly string[]): string {
  return values.length > 0 ? values.join(", ") : "아직 미정"
}

function formatWon(amount: number): string {
  return `${amount.toLocaleString("ko-KR")}원`
}
