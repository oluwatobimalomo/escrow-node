'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions } from '@/lib/db/schema'
import { and, eq, or, notInArray } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

// Statuses where money has fully settled one way or another — safe states
// to be in when deleting an account. Anything else means funds or an
// obligation are still in flight for this user.
const TERMINAL_STATUSES = ['completed', 'cancelled', 'refunded']

/**
 * Called before Better Auth's own deleteUser runs, since deleteUser will
 * happily hard-delete a user row regardless of whether they're a party to
 * an active, funded transaction — which would leave escrowed money with
 * no clear owner. This is an application-level safety check, not something
 * Better Auth or the database schema enforces on its own.
 */
export async function checkCanDeleteAccount() {
  const me = await getSessionUser()

  const active = await db
    .select({ id: transactions.id, code: transactions.code, status: transactions.status })
    .from(transactions)
    .where(
      and(
        or(eq(transactions.buyerId, me.id), eq(transactions.sellerId, me.id)),
        notInArray(transactions.status, TERMINAL_STATUSES),
      ),
    )

  if (active.length > 0) {
    return {
      canDelete: false,
      reason: `You have ${active.length} active transaction${active.length === 1 ? '' : 's'} (e.g. ${active[0].code}) that must be completed, cancelled, or resolved before you can delete your account.`,
    }
  }

  return { canDelete: true, reason: null }
}
