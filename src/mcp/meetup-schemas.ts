import { z } from "zod"

const messageListSchema = z.array(z.string().trim().min(1).max(300)).min(1).max(50)

export const meetupAvailabilityInputSchema = {
  messages: messageListSchema,
  topic: z.string().trim().min(2).max(100),
}

export const meetupAvailabilityOutputSchema = {
  availableDates: z.array(z.string()),
  placeSignals: z.array(z.string()),
  summary: z.string(),
  topic: z.string(),
  unavailableDates: z.array(z.string()),
}

export const meetupOptionRankInputSchema = {
  candidates: z
    .array(
      z.object({
        date: z.string().trim().min(1).max(50),
        place: z.string().trim().min(1).max(80),
      }),
    )
    .min(1)
    .max(20),
  messages: messageListSchema,
}

export const meetupOptionRankOutputSchema = {
  rankedOptions: z.array(
    z.object({
      date: z.string(),
      place: z.string(),
      reasons: z.array(z.string()),
      score: z.number(),
    }),
  ),
  recommendation: z.string(),
}

export const meetupPollDraftInputSchema = {
  options: z.array(z.string().trim().min(1).max(120)).min(2).max(10),
  topic: z.string().trim().min(2).max(100),
}

export const meetupPollDraftOutputSchema = {
  message: z.string(),
  options: z.array(z.string()),
  title: z.string(),
}

export const meetupFinalNoticeInputSchema = {
  date: z.string().trim().min(1).max(50),
  place: z.string().trim().min(1).max(100),
  time: z.string().trim().min(1).max(50),
  topic: z.string().trim().min(2).max(100),
}

export const meetupFinalNoticeOutputSchema = {
  checklist: z.array(z.string()),
  notice: z.string(),
}

export const meetupMissingPeopleInputSchema = {
  expectedPeople: z.array(z.string().trim().min(1).max(40)).min(1).max(50),
  messages: messageListSchema,
}

export const meetupMissingPeopleOutputSchema = {
  ambiguousPeople: z.array(z.string()),
  followUpAsk: z.string(),
  missingPeople: z.array(z.string()),
}

export const meetupSplitBillInputSchema = {
  participants: z.array(z.string().trim().min(1).max(40)).min(1).max(50),
  payer: z.string().trim().min(1).max(40),
  totalAmount: z.number().int().positive().max(100000000),
}

export const meetupSplitBillOutputSchema = {
  caution: z.array(z.string()),
  message: z.string(),
  perPersonAmount: z.number().int(),
}
