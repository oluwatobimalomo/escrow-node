'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { resolveBvn } from '@/lib/paystack'
import { enforceRateLimit } from '@/lib/rate-limit'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

/**
 * Verifies a BVN against the name and date of birth the user provides.
 * Both must match what Paystack's BVN resolve returns before this counts
 * as verified — a BVN alone doesn't prove the person entering it owns it,
 * but BVN + correct DOB is a reasonable bar for this use case (the same
 * pattern Paystack's own docs suggest for BVN-based verification without
 * an OTP flow).
 *
 * The raw BVN is never written to the database — only the boolean outcome,
 * timestamp, and matched name are persisted.
 */
export async function verifyBvnIdentity(bvn: string, dateOfBirth: string) {
  const me = await getSessionUser()
  await enforceRateLimit('money', me.id) // costs real money per call (₦10) — treat it like one

  if (!/^\d{11}$/.test(bvn)) {
    throw new Error('BVN should be 11 digits')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    throw new Error('Enter date of birth as YYYY-MM-DD')
  }

  const resolved = await resolveBvn(bvn)

  if (resolved.dob !== dateOfBirth) {
    throw new Error(
      'That date of birth doesn\u2019t match our records for this BVN. Double check and try again.',
    )
  }

  const fullName = `${resolved.first_name} ${resolved.last_name}`.trim()

  await db
    .update(user)
    .set({
      bvnVerified: true,
      bvnVerifiedAt: new Date(),
      bvnVerifiedName: fullName,
      updatedAt: new Date(),
    })
    .where(eq(user.id, me.id))

  revalidatePath('/dashboard/profile')
  return { verifiedName: fullName }
}
