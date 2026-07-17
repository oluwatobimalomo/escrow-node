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
  fundedAt: timestamp('fundedAt'),
  shippedAt: timestamp('shippedAt'),
  deliveredAt: timestamp('deliveredAt'),
  releasedAt: timestamp('releasedAt'),
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
  resolution: text('resolution'),
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

export type Transaction = typeof transactions.$inferSelect
export type TransactionEvent = typeof transactionEvents.$inferSelect
export type Dispute = typeof disputes.$inferSelect
export type Review = typeof reviews.$inferSelect
