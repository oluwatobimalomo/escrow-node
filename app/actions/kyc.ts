'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { lookupBvn } from '@/lib/dojah'
import { enforceRateLimit } from '@/lib/rate-limit'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

// Loose name comparison — BVN records are typically "SURNAME FIRSTNAME
// MIDDLENAME" in caps, while account names are free-typed in any order
// and case. Rather than require an exact match (which would fail almost
// every real case), check that most of the words in one name appear
// somewhere in the other.
function namesLikelyMatch(accountName: string, bvnName: string): boolean {
  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .split(/\s+/)
      .filter(Boolean)

  const accountWords = normalize(accountName)
  const bvnWords = new Set(normalize(bvnName))
  if (accountWords.length === 0 || bvnWords.size === 0) return false

  const matches = accountWords.filter((w) => bvnWords.has(w)).length
  // Require at least half the account name's words to show up in the BVN
  // name — tolerant of a missing middle name or minor formatting
  // differences, while still catching a genuinely different person.
  return matches / accountWords.length >= 0.5
}

/**
 * Verifies a BVN and checks the returned name against the account's own
 * name as a lightweight signal that the person submitting it actually
 * owns it. This is NOT equivalent to an OTP-based ownership check — a
 * BVN lookup alone only proves the number is real, not who's holding it.
 * Worth revisiting with a stronger provider-side ownership flow (OTP to
 * the phone number on file, etc.) if this needs to be more rigorous than
 * "reasonably discourages casual misuse."
 *
 * The raw BVN is never written to the database — only the boolean
 * outcome, timestamp, and matched name are persisted.
 */
export async function verifyBvnIdentity(bvn: string) {
  const me = await getSessionUser()
  await enforceRateLimit('money', me.id) // costs real money per call — treat it like one

  if (!/^\d{11}$/.test(bvn)) {
    throw new Error('BVN should be 11 digits')
  }

  const entity = await lookupBvn(bvn)
  const fullName = `${entity.first_name ?? ''} ${entity.last_name ?? ''}`.trim()

  if (!fullName) {
    throw new Error('Could not confirm a name for this BVN — try again or contact support.')
  }

  if (!namesLikelyMatch(me.name, fullName)) {
    throw new Error(
      `This BVN is registered to a different name (${fullName}) than your account (${me.name}). Make sure this is your own BVN, or update your account name to match.`,
    )
  }

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
