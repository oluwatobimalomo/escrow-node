'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  user,
  walletAddress,
  reviews,
  transactions,
  account,
} from '@/lib/db/schema'
import { and, avg, count, desc, eq, or } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { enforceRateLimit } from '@/lib/rate-limit'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

async function reputationFor(userId: string) {
  const [ratingRow] = await db
    .select({ avgRating: avg(reviews.rating), reviewCount: count(reviews.id) })
    .from(reviews)
    .where(eq(reviews.revieweeId, userId))

  const [completedRow] = await db
    .select({ completedCount: count(transactions.id) })
    .from(transactions)
    .where(
      and(
        eq(transactions.status, 'completed'),
        or(eq(transactions.buyerId, userId), eq(transactions.sellerId, userId)),
      ),
    )

  const recentReviews = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      reviewerName: user.name,
      reviewerId: user.id,
    })
    .from(reviews)
    .innerJoin(user, eq(reviews.reviewerId, user.id))
    .where(eq(reviews.revieweeId, userId))
    .orderBy(desc(reviews.createdAt))
    .limit(10)

  return {
    avgRating: ratingRow?.avgRating ? Number.parseFloat(ratingRow.avgRating) : null,
    reviewCount: ratingRow?.reviewCount ?? 0,
    completedCount: completedRow?.completedCount ?? 0,
    recentReviews,
  }
}

// --- Own profile -----------------------------------------------------------

export async function getMyProfile() {
  const me = await getSessionUser()

  const [profile] = await db.select().from(user).where(eq(user.id, me.id)).limit(1)
  if (!profile) throw new Error('Profile not found')

  const wallets = await db
    .select()
    .from(walletAddress)
    .where(eq(walletAddress.userId, me.id))

  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, me.id), eq(account.providerId, 'credential')))
    .limit(1)

  const reputation = await reputationFor(me.id)

  return {
    ...profile,
    wallets,
    hasPassword: Boolean(credential),
    ...reputation,
  }
}

export async function updateProfile(input: {
  name: string
  bio?: string
  image?: string
}) {
  const me = await getSessionUser()
  await enforceRateLimit('general', me.id)
  const name = input.name.trim()
  if (!name) throw new Error('Name cannot be empty')
  if (name.length > 100) throw new Error('Name is too long')
  if (input.bio && input.bio.length > 500)
    throw new Error('Bio must be 500 characters or fewer')

  await db
    .update(user)
    .set({
      name,
      bio: input.bio?.trim() || null,
      image: input.image?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(user.id, me.id))

  revalidatePath('/dashboard/profile')
  revalidatePath('/dashboard')
}

// --- Public profiles ---------------------------------------------------

export async function getPublicProfile(userId: string) {
  await getSessionUser() // profiles are visible to any signed-in user, not the public internet

  const [profile] = await db
    .select({
      id: user.id,
      name: user.name,
      image: user.image,
      bio: user.bio,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)
  if (!profile) throw new Error('User not found')

  const wallets = await db
    .select({ address: walletAddress.address })
    .from(walletAddress)
    .where(eq(walletAddress.userId, userId))

  const reputation = await reputationFor(userId)

  return {
    ...profile,
    walletLinked: wallets.length > 0,
    ...reputation,
  }
}
