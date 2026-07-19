'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, disputes, user, transactionEvents } from '@/lib/db/schema'
import { refundPaystackTransaction } from '@/lib/paystack'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'admin') throw new Error('Admin access required')
  return session.user
}

async function logEvent(
  transactionId: string,
  actorId: string | null,
  type: string,
  note?: string,
) {
  await db.insert(transactionEvents).values({ transactionId, actorId, type, note })
}

// --- Reads -------------------------------------------------------------

export async function listOpenDisputes() {
  await requireAdmin()

  const rows = await db
    .select({
      dispute: disputes,
      transaction: transactions,
    })
    .from(disputes)
    .innerJoin(transactions, eq(disputes.transactionId, transactions.id))
    .where(eq(disputes.status, 'open'))
    .orderBy(desc(disputes.createdAt))

  // Resolve buyer/seller/raiser display names in a couple of extra queries
  // rather than a wider join — this list is small (open disputes only) so
  // the extra round trips are cheap and keep the query readable.
  const userIds = new Set<string>()
  for (const { dispute, transaction } of rows) {
    if (transaction.buyerId) userIds.add(transaction.buyerId)
    if (transaction.sellerId) userIds.add(transaction.sellerId)
    userIds.add(dispute.raisedById)
  }
  const people = userIds.size
    ? await db.select().from(user)
    : []
  const byId = new Map(people.map((p) => [p.id, p]))

  return rows.map(({ dispute, transaction }) => ({
    ...dispute,
    transaction,
    buyer: transaction.buyerId ? (byId.get(transaction.buyerId) ?? null) : null,
    seller: transaction.sellerId ? (byId.get(transaction.sellerId) ?? null) : null,
    raisedBy: byId.get(dispute.raisedById) ?? null,
  }))
}

export async function isCurrentUserAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  return session?.user?.role === 'admin'
}

// --- Dispute resolution --------------------------------------------------

/**
 * Force-resolves a deadlocked dispute. Unlike the mutual-consent
 * `resolveDispute` (app/actions/transactions.ts), this doesn't require the
 * non-raising party's agreement — it's the escape hatch for when the two
 * parties can't agree.
 *
 * 'release' and the seller-facing portion of 'split' are DB-only status
 * changes, matching how a normal (non-disputed) delivery confirmation
 * already works elsewhere in this app — there's no seller payout API
 * wired in anywhere, disputed or not. 'refund' and the buyer-facing
 * portion of 'split' trigger a real Paystack refund, since that money is
 * actually sitting in a captured charge and Paystack's refund API can move
 * it back.
 */
export async function adminResolveDispute(
  disputeId: string,
  outcome: 'release' | 'refund' | 'split',
  options: { splitToBuyerNaira?: number; note?: string } = {},
) {
  const admin = await requireAdmin()

  const [dispute] = await db
    .select()
    .from(disputes)
    .where(and(eq(disputes.id, disputeId), eq(disputes.status, 'open')))
    .limit(1)
  if (!dispute) throw new Error('No open dispute with that id')

  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, dispute.transactionId))
    .limit(1)
  if (!tx) throw new Error('Transaction not found')
  if (tx.status !== 'disputed')
    throw new Error('Transaction is not currently in a disputed state')

  let refundAmount: number | null = null
  let refundReference: string | null = null

  if (outcome === 'refund' || outcome === 'split') {
    if (!tx.paystackReference) {
      throw new Error(
        'No Paystack reference on this transaction — cannot process a refund',
      )
    }
    const totalAmount = Number.parseFloat(tx.amount)
    const amountNaira =
      outcome === 'split'
        ? options.splitToBuyerNaira
        : undefined // undefined = full refund

    if (outcome === 'split') {
      if (
        options.splitToBuyerNaira == null ||
        options.splitToBuyerNaira <= 0 ||
        options.splitToBuyerNaira >= totalAmount
      ) {
        throw new Error(
          `For a split, enter an amount between 0 and ${totalAmount} to refund to the buyer`,
        )
      }
    }

    const refund = await refundPaystackTransaction({
      reference: tx.paystackReference,
      amountNaira,
    })
    refundAmount = amountNaira ?? totalAmount
    refundReference = refund.transaction_reference
  }

  const now = new Date()
  await db
    .update(disputes)
    .set({
      status: 'resolved',
      resolution: outcome,
      resolvedById: admin.id,
      adminNote: options.note?.trim() || null,
      resolvedAt: now,
      updatedAt: now,
    })
    .where(eq(disputes.id, dispute.id))

  await db
    .update(transactions)
    .set({
      // 'split' leaves the transaction as 'refunded' at the DB level since
      // that's the closer of the two existing statuses — the split detail
      // itself lives on refundAmount / the dispute record, not a third
      // transaction status.
      status: outcome === 'release' ? 'completed' : 'refunded',
      releasedAt: outcome === 'release' ? now : null,
      refundAmount: refundAmount != null ? String(refundAmount) : null,
      refundReference,
      updatedAt: now,
    })
    .where(eq(transactions.id, tx.id))

  const summary =
    outcome === 'release'
      ? 'Admin force-resolved dispute — funds released to seller'
      : outcome === 'refund'
        ? 'Admin force-resolved dispute — full refund issued to buyer'
        : `Admin force-resolved dispute — split: ₦${refundAmount} refunded to buyer, remainder to seller`
  await logEvent(tx.id, admin.id, 'dispute_resolved', summary)

  revalidatePath('/admin/disputes')
  revalidatePath(`/dashboard/transactions/${tx.id}`)
  revalidatePath('/dashboard')
}
