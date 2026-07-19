import {
  pgTable,
  text,
  timestamp,
  boolean,
  numeric,
  serial,
  integer,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables -------------------------------------------
// Column names are camelCase to match Better Auth's defaults. Do not rename.

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  bio: text('bio'),
  // Better Auth admin plugin fields. "admin" is the only elevated role in
  // use — see lib/auth.ts. Do not rename; the plugin writes these by name.
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('banReason'),
  banExpires: timestamp('banExpires'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// Required by the Better Auth SIWE (Sign-In with Ethereum) plugin. One row
// per wallet a user has linked; a user can link more than one address, with
// `isPrimary` marking the one used for display. Do not rename columns — the
// plugin writes to this table by these exact names.
export const walletAddress = pgTable('walletAddress', {
  id: text('id').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  address: text('address').notNull(),
  chainId: integer('chainId').notNull(),
  isPrimary: boolean('isPrimary').notNull().default(false),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

// --- App tables ------------------------------------------------------------

// Escrow transaction lifecycle statuses:
// awaiting_acceptance -> accepted -> funded -> shipped -> completed
// Any funded/shipped transaction can move to `disputed`, which resolves to
// `completed` (released to seller) or `refunded` (returned to buyer).
// `cancelled` is possible before funding.
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  title: text('title').notNull(),
  description: text('description'),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('NGN'),
  buyerId: text('buyerId'),
  sellerId: text('sellerId'),
  counterpartyEmail: text('counterpartyEmail'),
  creatorId: text('creatorId').notNull(),
  creatorRole: text('creatorRole').notNull().default('buyer'),
  status: text('status').notNull().default('awaiting_acceptance'),
  deliveryNote: text('deliveryNote'),
  // Paystack transaction reference for the funding charge. Set when the
  // buyer initiates payment; used by the webhook/callback to identify which
  // transaction a verified charge belongs to.
  paystackReference: text('paystackReference'),
  payerEmail: text('payerEmail'),
  fundedAt: timestamp('fundedAt'),
  shippedAt: timestamp('shippedAt'),
  deliveredAt: timestamp('deliveredAt'),
  releasedAt: timestamp('releasedAt'),
  // Set when an admin-forced dispute resolution triggers a real Paystack
  // refund (full or partial, as with a 'split' outcome). Null for
  // transactions that were never disputed/refunded, or refunded before
  // this tracking existed.
  refundAmount: numeric('refundAmount', { precision: 14, scale: 2 }),
  refundReference: text('refundReference'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const transactionEvents = pgTable('transaction_events', {
  id: serial('id').primaryKey(),
  transactionId: text('transactionId').notNull(),
  actorId: text('actorId'),
  type: text('type').notNull(),
  note: text('note'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export const disputes = pgTable('disputes', {
  id: text('id').primaryKey(),
  transactionId: text('transactionId').notNull(),
  raisedById: text('raisedById').notNull(),
  reason: text('reason').notNull(),
  details: text('details'),
  status: text('status').notNull().default('open'),
  // 'release' | 'refund' | 'split' — mutual-consent resolutions only ever
  // produce 'release'/'refund'; 'split' is admin-only (see app/actions/admin.ts).
  resolution: text('resolution'),
  // Set only when an admin force-resolves rather than the parties settling
  // between themselves.
  resolvedById: text('resolvedById'),
  adminNote: text('adminNote'),
  resolvedAt: timestamp('resolvedAt'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  transactionId: text('transactionId').notNull(),
  reviewerId: text('reviewerId').notNull(),
  revieweeId: text('revieweeId').notNull(),
  rating: integer('rating').notNull(),
  comment: text('comment'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
})

export type WalletAddress = typeof walletAddress.$inferSelect
export type Transaction = typeof transactions.$inferSelect
export type TransactionEvent = typeof transactionEvents.$inferSelect
export type Dispute = typeof disputes.$inferSelect
export type Review = typeof reviews.$inferSelect
