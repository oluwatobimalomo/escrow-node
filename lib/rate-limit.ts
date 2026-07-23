import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { headers } from 'next/headers'

// Fails open (allows the request) if Upstash isn't configured, rather than
// breaking the whole app in dev/preview environments that don't have it
// set up. In production this should always be configured — see
// RATE_LIMITING.md for setup.
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

function makeLimiter(tokens: number, window: `${number} ${'s' | 'm' | 'h'}`) {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(tokens, window),
    analytics: true,
  })
}

// Tiers, from tightest to loosest. Money-moving and auth-adjacent actions
// get the strictest limits since abuse there is the most expensive (fraud
// attempts, brute-forcing, or running up Paystack API calls); everything
// else gets a generous general-purpose limit mainly to blunt scripted
// abuse rather than to constrain normal usage.
const limiters = {
  // Funding, refunds, transfers, payout-account changes — anything that
  // either moves money or touches the Paystack API with side effects.
  money: makeLimiter(5, '1 m'),
  // Webhook/cron endpoints — keyed by source, not by user, since these are
  // hit by Paystack/Vercel rather than a logged-in person. Generous, but
  // still bounded so a misconfigured retry loop can't run unchecked.
  system: makeLimiter(30, '1 m'),
  // Everything else authenticated — creating transactions, disputes,
  // reviews, profile edits.
  general: makeLimiter(30, '1 m'),
} as const

type Tier = keyof typeof limiters

/**
 * Call at the top of a server action or route handler. Throws if the
 * caller has exceeded the tier's limit — callers just need to let the
 * error propagate (it already has a user-facing message).
 *
 * `identifier` should be the most specific thing available: a user id for
 * authenticated actions, an IP for unauthenticated ones. Falls back to
 * request IP automatically if not provided.
 */
export async function enforceRateLimit(tier: Tier, identifier?: string) {
  const limiter = limiters[tier]
  if (!limiter) return // Upstash not configured — fail open, see note above

  const id = identifier ?? (await getRequestIp())
  const { success, reset } = await limiter.limit(`${tier}:${id}`)
  if (!success) {
    const retryInSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000))
    throw new Error(
      `Too many requests. Try again in ${retryInSeconds}s.`,
    )
  }
}

async function getRequestIp() {
  const h = await headers()
  return (
    h.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    h.get('x-real-ip') ??
    'unknown'
  )
}
