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

/**
 * Verifies a BVN against the name and date of birth the user provides.
 * Reuses the bvnVerified / bvnVerifiedAt / bvnVerifiedName columns added
 * back when this was built against Paystack — those were never removed
 * when the feature was disabled, so no schema change is needed to bring
 * this back online against Dojah instead.
 *
 * The raw BVN is never written to the database — only the boolean
 * outcome, timestamp, and matched name are persisted, same
 * data-minimization approach as before.
 */
export async function verifyBvnIdentity(bvn: string, dateOfBirth: string) {
  const me = await getSessionUser()
  await enforceRateLimit('money', me.id) // costs real money per call — treat it like one

  if (!/^\d{11}$/.test(bvn)) {
    throw new Error('BVN should be 11 digits')
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    throw new Error('Enter date of birth as YYYY-MM-DD')
  }

  const entity = await lookupBvn(bvn)

  if (!entity.date_of_birth || entity.date_of_birth !== dateOfBirth) {
    throw new Error(
      'That date of birth doesn\u2019t match our records for this BVN. Double check and try again.',
    )
  }

  const fullName = `${entity.first_name ?? ''} ${entity.last_name ?? ''}`.trim()
  if (!fullName) {
    throw new Error('Could not confirm a name for this BVN — try again or contact support.')
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
