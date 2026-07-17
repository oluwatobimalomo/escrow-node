'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  transactions,
  transactionEvents,
  disputes,
  reviews,
  user,
} from '@/lib/db/schema'
import { generateTransactionCode } from '@/lib/escrow'
import { and, desc, eq, or, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

function isParty(tx: typeof transactions.$inferSelect, userId: string) {
  return tx.buyerId === userId || tx.sellerId === userId
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

export async function getMyTransactions() {
  const me = await getSessionUser()
  return db
    .select()
    .from(transactions)
    .where(
      or(
        eq(transactions.buyerId, me.id),
        eq(transactions.sellerId, me.id),
        and(
          eq(transactions.counterpartyEmail, me.email.toLowerCase()),
          eq(transactions.status, 'awaiting_acceptance'),
        ),
      ),
    )
    .orderBy(desc(transactions.createdAt))
}

export async function getTransactionDetail(id: string) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)

  if (!tx) return null
  const invited =
    tx.status === 'awaiting_acceptance' &&
    tx.counterpartyEmail === me.email.toLowerCase()
  if (!isParty(tx, me.id) && !invited) return null

  const events = await db
    .select()
    .from(transactionEvents)
    .where(eq(transactionEvents.transactionId, id))
    .orderBy(transactionEvents.createdAt)

  const txDisputes = await db
    .select()
    .from(disputes)
    .where(eq(disputes.transactionId, id))
    .orderBy(desc(disputes.createdAt))

  const txReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.transactionId, id))

  const partyIds = [tx.buyerId, tx.sellerId].filter(Boolean) as string[]
  const parties =
    partyIds.length > 0
      ? await db
          .select({ id: user.id, name: user.name, email: user.email })
          .from(user)
          .where(or(...partyIds.map((pid) => eq(user.id, pid))))
      : []

  return {
    transaction: tx,
    events,
    disputes: txDisputes,
    reviews: txReviews,
    parties,
    me: { id: me.id, email: me.email },
    invited,
  }
}

export async function getMyStats() {
  const me = await getSessionUser()
  const rows = await db
    .select({
      status: transactions.status,
      amount: transactions.amount,
      buyerId: transactions.buyerId,
      sellerId: transactions.sellerId,
    })
    .from(transactions)
    .where(or(eq(transactions.buyerId, me.id), eq(transactions.sellerId, me.id)))

  const active = rows.filter((r) =>
    ['accepted', 'funded', 'shipped', 'disputed'].includes(r.status),
  ).length
  const completed = rows.filter((r) => r.status === 'completed').length
  const inEscrow = rows
    .filter((r) => ['funded', 'shipped', 'disputed'].includes(r.status))
    .reduce((sum, r) => sum + Number.parseFloat(r.amount), 0)

  const [ratingRow] = await db
    .select({
      avg: sql<string | null>`avg(${reviews.rating})`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(eq(reviews.revieweeId, me.id))

  return {
    active,
    completed,
    inEscrow,
    rating: ratingRow?.avg ? Number.parseFloat(ratingRow.avg) : null,
    ratingCount: ratingRow?.count ?? 0,
  }
}

// --- Lifecycle actions ---------------------------------------------------

export async function createTransaction(input: {
  title: string
  description?: string
  amount: number
  role: 'buyer' | 'seller'
  counterpartyEmail: string
}) {
  const me = await getSessionUser()
  const title = input.title.trim()
  const counterpartyEmail = input.counterpartyEmail.trim().toLowerCase()

  if (!title) throw new Error('Title is required')
  if (!Number.isFinite(input.amount) || input.amount <= 0)
    throw new Error('Amount must be greater than zero')
  if (input.amount > 100_000_000) throw new Error('Amount is too large')
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(counterpartyEmail))
    throw new Error('Enter a valid counterparty email')
  if (counterpartyEmail === me.email.toLowerCase())
    throw new Error('You cannot transact with yourself')

  const id = randomUUID()
  await db.insert(transactions).values({
    id,
    code: generateTransactionCode(),
    title,
    description: input.description?.trim() || null,
    amount: input.amount.toFixed(2),
    buyerId: input.role === 'buyer' ? me.id : null,
    sellerId: input.role === 'seller' ? me.id : null,
    counterpartyEmail,
    creatorId: me.id,
    creatorRole: input.role,
    status: 'awaiting_acceptance',
  })
  await logEvent(id, me.id, 'created', `Created as ${input.role}`)
  revalidatePath('/dashboard')
  return { id }
}

export async function acceptTransaction(id: string) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.status, 'awaiting_acceptance'),
        eq(transactions.counterpartyEmail, me.email.toLowerCase()),
      ),
    )
    .limit(1)
  if (!tx) throw new Error('Transaction not found or cannot be accepted')

  await db
    .update(transactions)
    .set({
      buyerId: tx.creatorRole === 'seller' ? me.id : tx.buyerId,
      sellerId: tx.creatorRole === 'buyer' ? me.id : tx.sellerId,
      status: 'accepted',
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, id))
  await logEvent(id, me.id, 'accepted', 'Terms accepted by counterparty')
  revalidatePath(`/dashboard/transactions/${id}`)
  revalidatePath('/dashboard')
}

export async function cancelTransaction(id: string) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)
  if (!tx || tx.creatorId !== me.id) throw new Error('Not allowed')
  if (!['awaiting_acceptance', 'accepted'].includes(tx.status))
    throw new Error('Cannot cancel after funding')

  await db
    .update(transactions)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(transactions.id, id))
  await logEvent(id, me.id, 'cancelled')
  revalidatePath(`/dashboard/transactions/${id}`)
  revalidatePath('/dashboard')
}

export async function fundTransaction(id: string) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.status, 'accepted'),
        eq(transactions.buyerId, me.id),
      ),
    )
    .limit(1)
  if (!tx) throw new Error('Only the buyer can fund an accepted transaction')

  // Payment gateway integration point (Paystack/Flutterwave):
  // in production this transition happens in the gateway webhook after a
  // verified charge, not directly from the client.
  await db
    .update(transactions)
    .set({ status: 'funded', fundedAt: new Date(), updatedAt: new Date() })
    .where(eq(transactions.id, id))
  await logEvent(id, me.id, 'funded', 'Funds secured in escrow')
  revalidatePath(`/dashboard/transactions/${id}`)
  revalidatePath('/dashboard')
}

export async function markShipped(id: string, note?: string) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.status, 'funded'),
        eq(transactions.sellerId, me.id),
      ),
    )
    .limit(1)
  if (!tx) throw new Error('Only the seller can mark a funded transaction as shipped')

  await db
    .update(transactions)
    .set({
      status: 'shipped',
      shippedAt: new Date(),
      deliveryNote: note?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, id))
  await logEvent(id, me.id, 'shipped', note?.trim() || undefined)
  revalidatePath(`/dashboard/transactions/${id}`)
  revalidatePath('/dashboard')
}

export async function confirmDelivery(id: string) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.id, id),
        eq(transactions.status, 'shipped'),
        eq(transactions.buyerId, me.id),
      ),
    )
    .limit(1)
  if (!tx) throw new Error('Only the buyer can confirm delivery')

  const now = new Date()
  await db
    .update(transactions)
    .set({
      status: 'completed',
      deliveredAt: now,
      releasedAt: now,
      updatedAt: now,
    })
    .where(eq(transactions.id, id))
  await logEvent(id, me.id, 'delivered', 'Delivery confirmed by buyer')
  await logEvent(id, null, 'released', 'Escrow released to seller')
  revalidatePath(`/dashboard/transactions/${id}`)
  revalidatePath('/dashboard')
}

// --- Disputes -------------------------------------------------------------

export async function raiseDispute(
  id: string,
  reason: string,
  details?: string,
) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, id))
    .limit(1)
  if (!tx || !isParty(tx, me.id)) throw new Error('Not allowed')
  if (!['funded', 'shipped'].includes(tx.status))
    throw new Error('Disputes can only be raised while funds are in escrow')
  if (!reason.trim()) throw new Error('A reason is required')

  await db.insert(disputes).values({
    id: randomUUID(),
    transactionId: id,
    raisedById: me.id,
    reason: reason.trim(),
    details: details?.trim() || null,
  })
  await db
    .update(transactions)
    .set({ status: 'disputed', updatedAt: new Date() })
    .where(eq(transactions.id, id))
  await logEvent(id, me.id, 'disputed', reason.trim())
  revalidatePath(`/dashboard/transactions/${id}`)
  revalidatePath('/dashboard')
}

export async function resolveDispute(
  transactionId: string,
  outcome: 'release' | 'refund',
) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(
      and(eq(transactions.id, transactionId), eq(transactions.status, 'disputed')),
    )
    .limit(1)
  if (!tx || !isParty(tx, me.id)) throw new Error('Not allowed')

  const [openDispute] = await db
    .select()
    .from(disputes)
    .where(
      and(
        eq(disputes.transactionId, transactionId),
        eq(disputes.status, 'open'),
      ),
    )
    .limit(1)
  if (!openDispute) throw new Error('No open dispute')

  // Mutual-consent model: only the party who did NOT raise the dispute can
  // concede to an outcome, mirroring a two-party settlement.
  if (openDispute.raisedById === me.id)
    throw new Error(
      'The other party must agree to the resolution. You raised this dispute.',
    )

  const now = new Date()
  await db
    .update(disputes)
    .set({ status: 'resolved', resolution: outcome, resolvedAt: now, updatedAt: now })
    .where(eq(disputes.id, openDispute.id))

  await db
    .update(transactions)
    .set({
      status: outcome === 'release' ? 'completed' : 'refunded',
      releasedAt: outcome === 'release' ? now : null,
      updatedAt: now,
    })
    .where(eq(transactions.id, transactionId))

  await logEvent(
    transactionId,
    me.id,
    'dispute_resolved',
    outcome === 'release'
      ? 'Dispute settled — funds released to seller'
      : 'Dispute settled — funds refunded to buyer',
  )
  revalidatePath(`/dashboard/transactions/${transactionId}`)
  revalidatePath('/dashboard')
}

// --- Reviews ---------------------------------------------------------------

export async function submitReview(
  transactionId: string,
  rating: number,
  comment?: string,
) {
  const me = await getSessionUser()
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1)
  if (!tx || !isParty(tx, me.id)) throw new Error('Not allowed')
  if (!['completed', 'refunded'].includes(tx.status))
    throw new Error('You can only review finished transactions')
  if (!Number.isInteger(rating) || rating < 1 || rating > 5)
    throw new Error('Rating must be between 1 and 5')

  const revieweeId = tx.buyerId === me.id ? tx.sellerId : tx.buyerId
  if (!revieweeId) throw new Error('No counterparty to review')

  const existing = await db
    .select({ id: reviews.id })
    .from(reviews)
    .where(
      and(
        eq(reviews.transactionId, transactionId),
        eq(reviews.reviewerId, me.id),
      ),
    )
    .limit(1)
  if (existing.length > 0) throw new Error('You already reviewed this transaction')

  await db.insert(reviews).values({
    transactionId,
    reviewerId: me.id,
    revieweeId,
    rating,
    comment: comment?.trim() || null,
  })
  await logEvent(transactionId, me.id, 'reviewed', `${rating}/5 stars`)
  revalidatePath(`/dashboard/transactions/${transactionId}`)
}
