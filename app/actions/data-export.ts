'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { user, walletAddress, transactions, reviews, productListings } from '@/lib/db/schema'
import { or, eq } from 'drizzle-orm'
import { headers } from 'next/headers'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

/**
 * Everything TrustLock holds about the requesting user, gathered for a
 * self-service data export -- the kind of access NDPR (and similar data
 * protection regimes) expects to be available on request, not just
 * describable in a privacy policy. Deliberately excludes:
 *  - the raw BVN (never stored in the first place -- see bvnVerified
 *    comment in lib/db/schema.ts)
 *  - password hashes (Better Auth keeps these in its own `account` table,
 *    which this export does not touch)
 *  - other parties' data beyond what the user already sees in their own
 *    dashboard (counterparty name/email on a shared transaction, etc.)
 */
export async function getMyDataExport() {
  const me = await getSessionUser()

  const [profile] = await db.select().from(user).where(eq(user.id, me.id)).limit(1)
  if (!profile) throw new Error('Profile not found')

  const [wallets, myTransactions, reviewsGiven, reviewsReceived, myListings] = await Promise.all([
    db.select().from(walletAddress).where(eq(walletAddress.userId, me.id)),
    db
      .select()
      .from(transactions)
      .where(or(eq(transactions.buyerId, me.id), eq(transactions.sellerId, me.id))),
    db.select().from(reviews).where(eq(reviews.reviewerId, me.id)),
    db.select().from(reviews).where(eq(reviews.revieweeId, me.id)),
    db.select().from(productListings).where(eq(productListings.sellerId, me.id)),
  ])

  return {
    exported_at: new Date().toISOString(),
    profile: {
      id: profile.id,
      name: profile.name,
      email: profile.email,
      emailVerified: profile.emailVerified,
      bio: profile.bio,
      image: profile.image,
      role: profile.role,
      bvnVerified: profile.bvnVerified,
      bvnVerifiedAt: profile.bvnVerifiedAt,
      bvnVerifiedName: profile.bvnVerifiedName,
      twoFactorEnabled: profile.twoFactorEnabled,
      createdAt: profile.createdAt,
    },
    linked_wallets: wallets.map((w) => ({ address: w.address, isPrimary: w.isPrimary, linkedAt: w.createdAt })),
    transactions: myTransactions.map((t) => ({
      code: t.code,
      title: t.title,
      role: t.buyerId === me.id ? 'buyer' : 'seller',
      amount: t.amount,
      deliveryFee: t.deliveryFee,
      deliveryAddress: t.buyerId === me.id ? t.deliveryAddress : undefined,
      status: t.status,
      createdAt: t.createdAt,
      fundedAt: t.fundedAt,
      completedAt: t.releasedAt,
    })),
    reviews_you_wrote: reviewsGiven.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    reviews_about_you: reviewsReceived.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
    })),
    your_listings: myListings.map((l) => ({
      title: l.title,
      price: l.price,
      deliveryFee: l.deliveryFee,
      category: l.category,
      quantity: l.quantity,
      active: l.active,
      createdAt: l.createdAt,
    })),
  }
}
