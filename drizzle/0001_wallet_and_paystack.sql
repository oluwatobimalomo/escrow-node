-- Adds:
--   1. The `walletAddress` table required by Better Auth's SIWE plugin
--      (links a user to one or more Ethereum addresses).
--   2. `paystackReference` / `payerEmail` columns on `transactions`, used to
--      reconcile Paystack webhook/callback events back to a transaction.
--
-- Run once with: psql "$DATABASE_URL" -f drizzle/0001_wallet_and_paystack.sql
-- (If you later set up drizzle-kit against a live DATABASE_URL, running
-- `npm run db:generate` will detect these tables already exist and no-op.)

CREATE TABLE IF NOT EXISTS "walletAddress" (
  "id" text PRIMARY KEY NOT NULL,
  "userId" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "address" text NOT NULL,
  "chainId" integer NOT NULL,
  "isPrimary" boolean NOT NULL DEFAULT false,
  "createdAt" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "walletAddress_userId_idx" ON "walletAddress" ("userId");
CREATE UNIQUE INDEX IF NOT EXISTS "walletAddress_address_chainId_idx" ON "walletAddress" ("address", "chainId");

ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "paystackReference" text;
ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "payerEmail" text;
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_paystackReference_idx"
  ON "transactions" ("paystackReference")
  WHERE "paystackReference" IS NOT NULL;
