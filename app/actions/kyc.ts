'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { checkBvnNameMatch } from '@/lib/dojah'
import { enforceRateLimit } from '@/lib/rate-limit'
import { eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

// Splits "First Middle Last" into (first_name, last_name) the way Dojah's
// API expects two separate fields. Takes the first word as the first
// name and everything else as the last name — an imperfect heuristic for
// multi-part Nigerian names, but a reasonable default; there's no way to
// know someone's intended first/last split from a single free-text name
// field without asking them directly.
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') || parts[0] || '',
  }
}

// Confidence threshold below which we don't trust a "match" even if
// Dojah's boolean status says true — status alone was observed to be
// true even for a deliberately wrong sandbox test name (expected canned
// sandbox behavior), so leaning on confidence_value too is a reasonable
// extra guard once this runs against real data.
const MIN_CONFIDENCE = 60

/**
 * Verifies a BVN by submitting the account's own name and checking
 * Dojah's returned match status/confidence for each field — this API
 * doesn't hand back a name to compare ourselves; it does the matching
 * server-side. The raw BVN is never written to the database — only the
 * boolean outcome and timestamp are persisted.
 */
export async function verifyBvnIdentity(bvn: string) {
  const me = await getSessionUser()
  await enforceRateLimit('money', me.id) // costs real money per call — treat it like one

  if (!/^\d{11}$/.test(bvn)) {
    throw new Error('BVN should be 11 digits')
  }

  const { firstName, lastName } = splitName(me.name)
  if (!firstName || !lastName) {
    throw new Error(
      'Your account name needs both a first and last name before you can verify — update it above first.',
    )
  }

  const entity = await checkBvnNameMatch({ bvn, firstName, lastName })

  const firstOk =
    entity.first_name?.status === true &&
    (entity.first_name.confidence_value ?? 0) >= MIN_CONFIDENCE
  const lastOk =
    entity.last_name?.status === true &&
    (entity.last_name.confidence_value ?? 0) >= MIN_CONFIDENCE

  if (!firstOk || !lastOk) {
    throw new Error(
      `This BVN doesn't match the name on your account (${me.name}). Make sure this is your own BVN, or update your account name to match exactly.`,
    )
  }

  await db
    .update(user)
    .set({
      bvnVerified: true,
      bvnVerifiedAt: new Date(),
      bvnVerifiedName: me.name,
      updatedAt: new Date(),
    })
    .where(eq(user.id, me.id))

  revalidatePath('/dashboard/profile')
  return { verifiedName: me.name }
}
