'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { reviews, transactions, user } from '@/lib/db/schema'
import { eq, inArray, isNotNull } from 'drizzle-orm'
import { headers } from 'next/headers'

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'admin') throw new Error('Admin access required')
  return session.user
}

/**
 * Reviews with written comments, for admin moderation -- sorted so the
 * most likely low-effort/templated ones surface first (per the
 * best-effort authenticity score from lib/review-authenticity.ts).
 * Unscored reviews (comment too short, or the check failed/was
 * unavailable) sort to the end rather than being treated as suspicious.
 */
export async function getReviewsForModeration() {
  await requireAdmin()

  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      authenticityScore: reviews.authenticityScore,
      authenticityNote: reviews.authenticityNote,
      createdAt: reviews.createdAt,
      reviewerId: reviews.reviewerId,
      revieweeId: reviews.revieweeId,
      transactionCode: transactions.code,
      transactionTitle: transactions.title,
    })
    .from(reviews)
    .innerJoin(transactions, eq(reviews.transactionId, transactions.id))
    .where(isNotNull(reviews.comment))

  const userIds = [...new Set(rows.flatMap((r) => [r.reviewerId, r.revieweeId]))]
  const users = userIds.length
    ? await db.select({ id: user.id, name: user.name }).from(user).where(inArray(user.id, userIds))
    : []
  const nameById = new Map(users.map((u) => [u.id, u.name]))

  return rows
    .map((r) => ({
      ...r,
      reviewerName: nameById.get(r.reviewerId) ?? 'Unknown',
      revieweeName: nameById.get(r.revieweeId) ?? 'Unknown',
    }))
    .sort((a, b) => {
      if (a.authenticityScore === null && b.authenticityScore === null) return 0
      if (a.authenticityScore === null) return 1
      if (b.authenticityScore === null) return -1
      return a.authenticityScore - b.authenticityScore
    })
}
