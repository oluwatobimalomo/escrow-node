import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic()

export type AuthenticityCheck = {
  score: number
  note: string
}

/**
 * Best-effort authenticity signal for a submitted review, using an LLM to
 * flag patterns associated with low-effort, templated, or bot-generated
 * text. This is explicitly advisory, not a determination of fact -- no
 * automated system can reliably prove a review is "fake." It:
 *  - never blocks or delays review submission on failure (best-effort,
 *    swallows errors)
 *  - never scores reviews too short to meaningfully assess, so brief but
 *    genuine reviews are not penalized just for being brief
 *  - is only ever surfaced to admins for human judgement (see
 *    app/admin/reviews), never shown to the public or the reviewer
 */
export async function checkReviewAuthenticity(
  reviewText: string | null | undefined,
  rating: number,
): Promise<AuthenticityCheck | null> {
  const trimmed = reviewText?.trim() ?? ''
  if (trimmed.length < 10) return null

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [
        {
          role: 'user',
          content: `You are assisting human moderators at an escrow marketplace by flagging POSSIBLY low-effort, templated, or inauthentic-sounding review text for human review. You are not making a final determination. Short, plain, or simple reviews should NOT be scored low just for being brief or unremarkable -- only flag genuinely generic/templated/bot-like patterns, or a rating-versus-tone mismatch.

Rating given: ${rating}/5
Review text: "${trimmed.replace(/"/g, "'")}"

Respond with ONLY a JSON object, no other text, no markdown fences:
{"score": <integer 0-100, 100 = clearly genuine and specific, 0 = highly generic/templated/suspicious>, "note": "<one short sentence explaining the score, written for a human moderator>"}`,
        },
      ],
    })

    const textBlock = message.content.find((b) => b.type === 'text')
    if (!textBlock || textBlock.type !== 'text') return null

    const parsed = JSON.parse(textBlock.text.trim())
    if (typeof parsed.score !== 'number' || typeof parsed.note !== 'string') return null

    return {
      score: Math.max(0, Math.min(100, Math.round(parsed.score))),
      note: String(parsed.note).slice(0, 300),
    }
  } catch (err) {
    console.error('Review authenticity check failed:', err)
    return null
  }
}
