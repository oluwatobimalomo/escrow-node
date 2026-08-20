'use server'

import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { enforceRateLimit } from '@/lib/rate-limit'
import { eq } from 'drizzle-orm'

/**
 * Used by the sign-up form to give an explicit "this email is already
 * registered" message instead of letting the person submit and land on a
 * generic "check your email" screen with nothing actually new sent.
 *
 * Trade-off, deliberately made: this lets anyone probe whether a given
 * email has a TrustLock account (the sign-up flow itself,
 * onExistingUserSignUp in lib/auth.ts, intentionally does NOT reveal this
 * — it shows the same response either way to prevent exactly this kind of
 * enumeration). Rate-limited by IP since there's no user identity yet at
 * this point, to blunt bulk scraping rather than eliminate the exposure
 * entirely.
 */
export async function checkEmailAvailable(email: string) {
  await enforceRateLimit('general')
  const trimmed = email.trim()
  if (!trimmed) return { available: true }

  // Intentionally not lowercasing — Better Auth's own email/password
  // provider doesn't normalize case either, so matching its exact
  // comparison here avoids this check disagreeing with what actually
  // happens on submit.
  const [existing] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, trimmed))
    .limit(1)

  return { available: !existing }
}
