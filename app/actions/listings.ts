'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { productListings, transactions, user, reviews } from '@/lib/db/schema'
import { generateTransactionCode } from '@/lib/escrow'
import { logEvent } from '@/app/actions/transactions'
import { enforceRateLimit } from '@/lib/rate-limit'
import { notifyListingPurchased } from '@/lib/notify'
import { and, desc, eq, gt, inArray, ne, sql } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

/**
 * Aggregate rating lookup for a batch of sellers — one query for however
 * many distinct sellers appear on a listings page, rather than one query
 * per listing. Mirrors the avg/count pattern already used for a user's own
 * rating in app/actions/transactions.ts (getMyStats).
 */
async function getSellerRatings(sellerIds: string[]) {
  if (sellerIds.length === 0) return new Map<string, { avg: number | null; count: number }>()
  const rows = await db
    .select({
      revieweeId: reviews.revieweeId,
      avg: sql<string | null>`avg(${reviews.rating})`,
      count: sql<number>`count(*)::int`,
    })
    .from(reviews)
    .where(inArray(reviews.revieweeId, sellerIds))
    .groupBy(reviews.revieweeId)
  return new Map(
    rows.map((r) => [
      r.revieweeId,
      { avg: r.avg ? Number.parseFloat(r.avg) : null, count: r.count },
    ]),
  )
}

// --- Reads ---------------------------------------------------------------

/**
 * Marketplace browse feed — active listings with stock remaining, newest
 * first, excluding the viewer's own listings. Sellers manage and view
 * their own listings from "My listings" instead; showing them here too
 * would be redundant and would surface a Buy button that's blocked anyway
 * (buyFromListing already rejects buying your own listing).
 */
export async function getActiveListings() {
  const me = await getSessionUser()
  const listings = await db
    .select()
    .from(productListings)
    .where(
      and(
        eq(productListings.active, true),
        gt(productListings.quantity, 0),
        ne(productListings.sellerId, me.id),
      ),
    )
    .orderBy(desc(productListings.createdAt))

  const ratings = await getSellerRatings([...new Set(listings.map((l) => l.sellerId))])
  return listings.map((listing) => ({
    ...listing,
    sellerRating: ratings.get(listing.sellerId) ?? { avg: null, count: 0 },
  }))
}

export async function getListing(id: string) {
  const [listing] = await db
    .select()
    .from(productListings)
    .where(eq(productListings.id, id))
    .limit(1)
  if (!listing) return null

  const [seller] = await db
    .select({ id: user.id, name: user.name, image: user.image })
    .from(user)
    .where(eq(user.id, listing.sellerId))
    .limit(1)

  const ratings = await getSellerRatings([listing.sellerId])
  const sellerRating = ratings.get(listing.sellerId) ?? { avg: null, count: 0 }

  return { ...listing, seller: seller ?? null, sellerRating }
}

export async function getMyListings() {
  const me = await getSessionUser()
  return db
    .select()
    .from(productListings)
    .where(eq(productListings.sellerId, me.id))
    .orderBy(desc(productListings.createdAt))
}

// --- Writes ----------------------------------------------------------------

export async function createListing(input: {
  title: string
  description?: string
  image?: string
  price: number
  quantity: number
}) {
  const me = await getSessionUser()
  await enforceRateLimit('general', me.id)
  const title = input.title.trim()

  if (!title) throw new Error('Title is required')
  if (!Number.isFinite(input.price) || input.price <= 0)
    throw new Error('Price must be greater than zero')
  if (input.price > 100_000_000) throw new Error('Price is too large')
  if (!Number.isInteger(input.quantity) || input.quantity < 1)
    throw new Error('Quantity must be at least 1')
  if (input.quantity > 100_000) throw new Error('Quantity is too large')
  // Same reasoning as the transaction/profile image checks — this is
  // rendered directly as <img src> on the browse page and listing detail.
  if (
    input.image &&
    !/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(input.image)
  )
    throw new Error('Invalid image')

  const id = randomUUID()
  await db.insert(productListings).values({
    id,
    sellerId: me.id,
    title,
    description: input.description?.trim() || null,
    image: input.image || null,
    price: input.price.toFixed(2),
    quantity: input.quantity,
  })
  revalidatePath('/dashboard/listings')
  revalidatePath('/dashboard/marketplace')
  return { id }
}

export async function updateListing(
  id: string,
  input: {
    title: string
    description?: string
    image?: string
    price: number
    quantity: number
    active: boolean
  },
) {
  const me = await getSessionUser()
  const [listing] = await db
    .select()
    .from(productListings)
    .where(eq(productListings.id, id))
    .limit(1)
  if (!listing) throw new Error('Listing not found')
  if (listing.sellerId !== me.id) throw new Error('Not your listing')

  const title = input.title.trim()
  if (!title) throw new Error('Title is required')
  if (!Number.isFinite(input.price) || input.price <= 0)
    throw new Error('Price must be greater than zero')
  if (!Number.isInteger(input.quantity) || input.quantity < 0)
    throw new Error('Quantity cannot be negative')
  if (
    input.image &&
    !/^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\//.test(input.image)
  )
    throw new Error('Invalid image')

  await db
    .update(productListings)
    .set({
      title,
      description: input.description?.trim() || null,
      image: input.image || null,
      price: input.price.toFixed(2),
      quantity: input.quantity,
      active: input.active,
      updatedAt: new Date(),
    })
    .where(eq(productListings.id, id))

  revalidatePath('/dashboard/listings')
  revalidatePath('/dashboard/marketplace')
}

export async function setListingActive(id: string, active: boolean) {
  const me = await getSessionUser()
  const [listing] = await db
    .select({ sellerId: productListings.sellerId })
    .from(productListings)
    .where(eq(productListings.id, id))
    .limit(1)
  if (!listing) throw new Error('Listing not found')
  if (listing.sellerId !== me.id) throw new Error('Not your listing')

  await db
    .update(productListings)
    .set({ active, updatedAt: new Date() })
    .where(eq(productListings.id, id))

  revalidatePath('/dashboard/listings')
  revalidatePath('/dashboard/marketplace')
}

/**
 * Buys one unit from a listing: atomically decrements stock (guarding
 * against overselling if two buyers click at the same time), then creates
 * a transaction pre-filled from the listing and already in 'accepted'
 * status — the seller already committed to these exact terms by
 * publishing the listing, so there's no separate accept step like there
 * is for a direct-invite transaction.
 */
export async function buyFromListing(listingId: string) {
  const me = await getSessionUser()
  await enforceRateLimit('general', me.id)

  const [listing] = await db
    .select()
    .from(productListings)
    .where(eq(productListings.id, listingId))
    .limit(1)
  if (!listing) throw new Error('Listing not found')
  if (!listing.active) throw new Error('This listing is no longer available')
  if (listing.sellerId === me.id) throw new Error('You cannot buy your own listing')

  const [seller] = await db
    .select({ email: user.email })
    .from(user)
    .where(eq(user.id, listing.sellerId))
    .limit(1)
  if (!seller) throw new Error('Seller not found')

  // Atomic guarded decrement — only succeeds if quantity is still > 0 at
  // the moment this runs, so two concurrent buyers can't both succeed off
  // the same last unit.
  const [updated] = await db
    .update(productListings)
    .set({
      quantity: sql`${productListings.quantity} - 1`,
      updatedAt: new Date(),
    })
    .where(and(eq(productListings.id, listingId), gt(productListings.quantity, 0)))
    .returning({ quantity: productListings.quantity })

  if (!updated) throw new Error('This item just sold out')
  if (updated.quantity === 0) {
    await db
      .update(productListings)
      .set({ active: false })
      .where(eq(productListings.id, listingId))
  }

  const id = randomUUID()
  await db.insert(transactions).values({
    id,
    code: generateTransactionCode(),
    title: listing.title,
    description: listing.description,
    image: listing.image,
    amount: listing.price,
    buyerId: me.id,
    sellerId: listing.sellerId,
    counterpartyEmail: seller.email,
    creatorId: me.id,
    creatorRole: 'buyer',
    status: 'accepted',
    listingId: listing.id,
  })

  await logEvent(id, me.id, 'created_from_listing', `Bought from listing ${listing.id}`)

  const [newTx] = await db.select().from(transactions).where(eq(transactions.id, id)).limit(1)
  if (newTx) await notifyListingPurchased(newTx)

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/marketplace')
  return { id }
}
