'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { transactions, disputes, reviews, user } from '@/lib/db/schema'
import { headers } from 'next/headers'
import { assessTransactionRisk } from '@/lib/risk-scoring'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'admin') throw new Error('Admin access required')
  return session.user
}

const RESOLVED_ESCROW_STATUSES = ['funded', 'shipped', 'disputed', 'completed', 'refunded']
const ACTIVE_STATUSES = ['funded', 'shipped', 'disputed']

/**
 * Scores every currently-active transaction (funded, shipped, or disputed
 * -- i.e. money is live in escrow right now) against the rule-based risk
 * model in lib/risk-scoring.ts, so admins can proactively review
 * high-risk transactions before a dispute is even raised, rather than
 * only reacting after the fact.
 */
export async function getRiskScoredTransactions() {
  await requireAdmin()

  const [allTx, allDisputes, allReviews, allUsers] = await Promise.all([
    db.select().from(transactions),
    db.select({ transactionId: disputes.transactionId }).from(disputes),
    db.select({ revieweeId: reviews.revieweeId, rating: reviews.rating }).from(reviews),
    db.select({ id: user.id, createdAt: user.createdAt, bvnVerified: user.bvnVerified }).from(user),
  ])

  const userById = new Map(allUsers.map((u) => [u.id, u]))
  const disputedTxIds = new Set(allDisputes.map((d) => d.transactionId))

  const sellerStats = new Map<string, { completedCount: number; fundedCount: number; disputeCount: number }>()
  for (const t of allTx) {
    if (!t.sellerId) continue
    const s = sellerStats.get(t.sellerId) ?? { completedCount: 0, fundedCount: 0, disputeCount: 0 }
    if (t.status === 'completed') s.completedCount++
    if (RESOLVED_ESCROW_STATUSES.includes(t.status)) s.fundedCount++
    if (disputedTxIds.has(t.id)) s.disputeCount++
    sellerStats.set(t.sellerId, s)
  }

  const reviewsByReviewee = new Map<string, number[]>()
  for (const r of allReviews) {
    const arr = reviewsByReviewee.get(r.revieweeId) ?? []
    arr.push(r.rating)
    reviewsByReviewee.set(r.revieweeId, arr)
  }

  const activeTx = allTx.filter((t) => ACTIVE_STATUSES.includes(t.status) && t.sellerId)

  const scored = activeTx.map((t) => {
    const seller = userById.get(t.sellerId!)
    const stats = sellerStats.get(t.sellerId!) ?? { completedCount: 0, fundedCount: 0, disputeCount: 0 }
    const ratings = reviewsByReviewee.get(t.sellerId!) ?? []
    const accountAgeDays = seller
      ? (Date.now() - new Date(seller.createdAt).getTime()) / 86_400_000
      : 0

    const assessment = assessTransactionRisk({
      amount: Number.parseFloat(t.amount),
      isDirectInvite: !t.listingId,
      sellerAccountAgeDays: accountAgeDays,
      sellerCompletedTransactionCount: stats.completedCount,
      sellerReviewCount: ratings.length,
      sellerAvgRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
      sellerDisputeCount: stats.disputeCount,
      sellerTotalFundedCount: stats.fundedCount,
      sellerBvnVerified: seller?.bvnVerified ?? false,
    })

    return {
      transactionId: t.id,
      code: t.code,
      title: t.title,
      amount: t.amount,
      status: t.status,
      ...assessment,
    }
  })

  return scored.sort((a, b) => b.score - a.score)
}
