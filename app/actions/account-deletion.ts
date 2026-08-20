'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  transactions,
  reviews,
  disputes,
  payoutAccounts,
  walletAddress,
  accountDeletionFeedback,
} from '@/lib/db/schema'
import { sendEmail, accountDataExportEmailHtml } from '@/lib/email'
import { and, eq, or, notInArray, inArray } from 'drizzle-orm'
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

/**
 * Runs immediately before the account is actually deleted:
 * 1. Re-checks the same active-transaction safety gate as
 *    checkCanDeleteAccount (defense in depth — the two calls could
 *    otherwise race if the user has two tabs open).
 * 2. Records the exit-survey reason to accountDeletionFeedback. This
 *    table has no FK to `user` on purpose — it's meant to outlive the
 *    account it's about, so support/product can still see why people
 *    left after their row is gone.
 * 3. Compiles everything this user has on the platform into a JSON
 *    export and emails it to them, since the export has to happen
 *    before the row (and everything cascading from it) is gone.
 *
 * The actual deletion itself still happens client-side via
 * authClient.deleteUser() immediately after this resolves — see
 * DeleteAccountSection.
 */
export async function submitExitSurveyAndPrepareDeletion(reason: string) {
  const me = await getSessionUser()

  const check = await checkCanDeleteAccount()
  if (!check.canDelete) return check

  const [myTransactions, myReviewsGiven, myReviewsReceived, myPayoutAccount, myWallets] =
    await Promise.all([
      db
        .select()
        .from(transactions)
        .where(or(eq(transactions.buyerId, me.id), eq(transactions.sellerId, me.id))),
      db.select().from(reviews).where(eq(reviews.reviewerId, me.id)),
      db.select().from(reviews).where(eq(reviews.revieweeId, me.id)),
      db.select().from(payoutAccounts).where(eq(payoutAccounts.userId, me.id)),
      db.select().from(walletAddress).where(eq(walletAddress.userId, me.id)),
    ])

  const myTransactionIds = myTransactions.map((t) => t.id)
  const myDisputes =
    myTransactionIds.length > 0
      ? await db
          .select()
          .from(disputes)
          .where(inArray(disputes.transactionId, myTransactionIds))
      : []

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    profile: { id: me.id, name: me.name, email: me.email },
    transactions: myTransactions,
    reviewsGiven: myReviewsGiven,
    reviewsReceived: myReviewsReceived,
    disputes: myDisputes,
    // Bank account number is what the user gave us and is meaningful to
    // include in a personal-data export; the Paystack recipient code is
    // an internal reference with no value to the user, so it's omitted.
    payoutAccount: myPayoutAccount.map(({ paystackRecipientCode, ...rest }) => rest),
    linkedWallets: myWallets.map((w) => ({ address: w.address, chainId: w.chainId })),
  }

  const attachmentContent = Buffer.from(JSON.stringify(exportPayload, null, 2)).toString('base64')

  await Promise.all([
    db.insert(accountDeletionFeedback).values({
      userId: me.id,
      userEmail: me.email,
      reason: reason.trim() || null,
    }),
    sendEmail({
      to: me.email,
      subject: 'Your TrustLock data (account being deleted)',
      html: accountDataExportEmailHtml(),
      attachments: [{ filename: 'trustlock-data-export.json', content: attachmentContent }],
    }),
  ])

  return { canDelete: true, reason: null }
}
