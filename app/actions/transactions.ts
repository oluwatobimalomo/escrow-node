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
import { initializePaystackTransaction } from '@/lib/paystack'
import { calculatePayout, payoutScheduledFor } from '@/lib/payout'
import { and, desc, eq, or, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

async function getBaseUrl() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

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

export async function initiateFunding(id: string, email: string) {
  const me = await getSessionUser()
  const trimmedEmail = email.trim().toLowerCase()
  if (!trimmedEmail || !trimmedEmail.includes('@')) {
    throw new Error('A valid email is required for the payment receipt')
  }

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
  if (tx.currency !== 'NGN') {
    throw new Error('Paystack funding currently supports NGN transactions only')
  }

  const reference = `${tx.code}-${randomUUID().slice(0, 8)}`
  const baseUrl = await getBaseUrl()

  const paystackTx = await initializePaystackTransaction({
    email: trimmedEmail,
    amountNaira: Number.parseFloat(tx.amount),
    reference,
    callbackUrl: `${baseUrl}/api/paystack/callback`,
    metadata: { transactionId: tx.id, transactionCode: tx.code },
  })

  await db
    .update(transactions)
    .set({
      paystackReference: reference,
      payerEmail: trimmedEmail,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, id))
  await logEvent(id, me.id, 'funding_initiated', `Payment started via Paystack (${reference})`)
  revalidatePath(`/dashboard/transactions/${id}`)

  return { authorizationUrl: paystackTx.authorization_url }
}

/**
 * Marks a transaction funded after a verified Paystack charge. This is
 * intentionally NOT a client-callable server action — it's called only from
 * the webhook and callback route handlers, which have already verified the
 * charge against Paystack's API/signature. Never trust a "funded" transition
 * that originates directly from the browser.
 */
export async function markFundedFromVerifiedPayment(reference: string) {
  const [tx] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.paystackReference, reference))
    .limit(1)
  if (!tx) return null
  if (tx.status !== 'accepted') return tx // already processed or in a later state; idempotent no-op

  await db
    .update(transactions)
    .set({ status: 'funded', fundedAt: new Date(), updatedAt: new Date() })
    .where(eq(transactions.id, tx.id))
  await logEvent(tx.id, null, 'funded', 'Funds secured in escrow via Paystack')
  revalidatePath(`/dashboard/transactions/${tx.id}`)
  revalidatePath('/dashboard')
  return tx
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
  const { feeAmount, payoutAmount } = calculatePayout(Number.parseFloat(tx.amount))
  await db
    .update(transactions)
    .set({
      status: 'completed',
      deliveredAt: now,
      releasedAt: now,
      platformFeeAmount: String(feeAmount),
      payoutAmount: String(payoutAmount),
      payoutStatus: 'scheduled',
      payoutScheduledAt: payoutScheduledFor(now),
      updatedAt: now,
    })
    .where(eq(transactions.id, id))
  await logEvent(id, me.id, 'delivered', 'Delivery confirmed by buyer')
  await logEvent(
    id,
    null,
    'released',
    `Escrow released — payout of ${payoutAmount} scheduled after the cooling-off window`,
  )
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
