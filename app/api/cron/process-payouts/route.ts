import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { transactions, payoutAccounts, user } from '@/lib/db/schema'
import { initiateTransfer } from '@/lib/paystack'
import { sendEmail } from '@/lib/email'
import { notifyPayoutSent } from '@/lib/notify'
import { and, eq, isNotNull, lte } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// Vercel signs cron-triggered requests with `Authorization: Bearer
// ${CRON_SECRET}` automatically when CRON_SECRET is set as an env var — no
// extra config needed beyond setting that variable. This also blocks
// anyone else from hitting this route and triggering payouts on demand.
function isAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  return request.headers.get('authorization') === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const due = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.payoutStatus, 'scheduled'),
        isNotNull(transactions.payoutScheduledAt),
        lte(transactions.payoutScheduledAt, new Date()),
      ),
    )

  const results: { transactionId: string; outcome: string }[] = []

  for (const tx of due) {
    if (!tx.sellerId || !tx.payoutAmount) {
      results.push({ transactionId: tx.id, outcome: 'skipped_missing_data' })
      continue
    }

    const [account] = await db
      .select()
      .from(payoutAccounts)
      .where(eq(payoutAccounts.userId, tx.sellerId))
      .limit(1)

    if (!account) {
      await db
        .update(transactions)
        .set({ payoutStatus: 'blocked_no_bank_details', updatedAt: new Date() })
        .where(eq(transactions.id, tx.id))

      const [seller] = await db
        .select({ email: user.email, name: user.name })
        .from(user)
        .where(eq(user.id, tx.sellerId))
        .limit(1)
      if (seller) {
        await sendEmail({
          to: seller.email,
          subject: 'Action needed — add your payout details on TrustLock',
          html: `<p>Hi ${seller.name},</p><p>Your payout of ₦${tx.payoutAmount} for "${tx.title}" is ready to send, but you haven't added a bank account yet. Add one in your TrustLock profile to receive it.</p>`,
        }).catch((err) => console.error('Payout reminder email failed:', err))
      }

      results.push({ transactionId: tx.id, outcome: 'blocked_no_bank_details' })
      continue
    }

    try {
      const reference = `payout-${tx.code}-${randomUUID().slice(0, 8)}`
      const transfer = await initiateTransfer({
        recipientCode: account.paystackRecipientCode,
        amountNaira: Number.parseFloat(tx.payoutAmount),
        reference,
        reason: `TrustLock payout for ${tx.code}`,
      })
      await db
        .update(transactions)
        .set({
          payoutStatus: 'paid',
          payoutReference: transfer.reference,
          payoutAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, tx.id))
      await notifyPayoutSent({ ...tx, payoutStatus: 'paid' })
      results.push({ transactionId: tx.id, outcome: 'paid' })
    } catch (err) {
      console.error(`Payout failed for transaction ${tx.id}:`, err)
      await db
        .update(transactions)
        .set({ payoutStatus: 'failed', updatedAt: new Date() })
        .where(eq(transactions.id, tx.id))
      results.push({ transactionId: tx.id, outcome: 'failed' })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
