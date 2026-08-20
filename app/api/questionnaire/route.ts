import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { questionnaireResponses } from '@/lib/db/schema'
import { enforceRateLimit } from '@/lib/rate-limit'

// Public, unauthenticated endpoint — study participants submit this without
// an account, so (unlike the Paystack webhook) there's no signature to
// verify. Rate limiting is the main abuse guard, on its own tier so it
// can't be throttled by (or throttle) unrelated webhook/system traffic.
export async function POST(request: Request) {
  try {
    await enforceRateLimit('questionnaire')
  } catch {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429 })
  }

  let body: {
    participant_id?: string | null
    sus_responses?: unknown
    sus_score?: unknown
    trust_responses?: unknown
    trust_mean?: unknown
    qualitative?: unknown
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const {
    participant_id,
    sus_responses,
    sus_score,
    trust_responses,
    trust_mean,
    qualitative,
  } = body

  const susValid =
    Array.isArray(sus_responses) &&
    sus_responses.length === 10 &&
    sus_responses.every((n) => typeof n === 'number' && n >= 1 && n <= 5)

  const trustValid =
    Array.isArray(trust_responses) &&
    trust_responses.length === 7 &&
    trust_responses.every((n) => typeof n === 'number' && n >= 1 && n <= 5)

  const qualValid = typeof qualitative === 'object' && qualitative !== null

  if (
    !susValid ||
    !trustValid ||
    typeof sus_score !== 'number' ||
    typeof trust_mean !== 'number' ||
    !qualValid
  ) {
    return NextResponse.json({ error: 'Malformed response' }, { status: 400 })
  }

  await db.insert(questionnaireResponses).values({
    participantId:
      typeof participant_id === 'string' && participant_id.trim()
        ? participant_id.trim()
        : null,
    susResponses: sus_responses,
    susScore: String(sus_score),
    trustResponses: trust_responses,
    trustMean: String(trust_mean),
    qualitative,
  })

  return NextResponse.json({ received: true })
}
