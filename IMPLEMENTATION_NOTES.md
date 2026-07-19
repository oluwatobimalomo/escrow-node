# What changed — decentralized identity + real funding

## 1. Wallet-based decentralized identity (Sign-In with Ethereum)

- `lib/auth.ts` — added Better Auth's official `siwe` plugin (ERC-4361). Nonce
  generation and signature verification (via `viem`) are wired up. `anonymous: true`
  means a wallet alone is enough to create an account — no email required at
  sign-in.
- `lib/auth-client.ts` — added the matching `siweClient` plugin.
- `lib/db/schema.ts` — added the `walletAddress` table the plugin needs
  (userId, address, chainId, isPrimary).
- `lib/wallet.ts` — browser helpers: `connectWallet()` (prompts MetaMask/any
  injected wallet), `signSiweMessage()` (builds + signs the ERC-4361 message).
  Deliberately uses the raw injected provider (`window.ethereum`) via `viem`
  rather than wagmi/RainbowKit/WalletConnect, since those need an external
  WalletConnect Cloud project ID I don't have. If you later want
  WalletConnect/mobile-wallet support (not just browser extensions), that's
  the piece to add.
- `components/wallet-connect-button.tsx` + updated `components/auth-form.tsx`
  — "Continue with wallet" now sits under the existing email/password form
  on both `/sign-in` and `/sign-up`.

## 2. Real fiat funding (Paystack) — replacing the mocked "Fund escrow" flip

The old `fundTransaction` just flipped a DB status with a comment marking it
as the spot to wire in a gateway. That's now real:

- `lib/paystack.ts` — initialize a charge, verify a charge, verify webhook
  HMAC-SHA512 signatures.
- `app/actions/transactions.ts` — `initiateFunding(id, email)` starts a
  Paystack charge and returns the checkout URL; the transaction only moves to
  `funded` once a payment is **verified**, via `markFundedFromVerifiedPayment`.
- `app/api/paystack/webhook/route.ts` — the source of truth. Verifies the
  signature, re-verifies against Paystack's API, then marks the transaction
  funded. Register `https://<your-domain>/api/paystack/webhook` in the
  Paystack dashboard.
- `app/api/paystack/callback/route.ts` — where Paystack redirects the buyer's
  browser after checkout. Purely a UX shortcut; not trusted on its own.
- `components/dashboard/transaction-actions.tsx` — "Fund escrow" now opens a
  dialog confirming the payer's email, then redirects to Paystack checkout.

**Currency note:** the thesis and this app both quote amounts in NGN, so this
funds in NGN via Paystack. Wallet-only users don't have a real email on file
(SIWE anonymous sign-in generates a placeholder) — the funding dialog is
where they supply a real one, since Paystack needs it for the receipt.

## 3. Setup

1. `npm install` (viem + drizzle-kit were added to `package.json`)
2. Run `drizzle/0001_wallet_and_paystack.sql` against your database once:
   `psql "$DATABASE_URL" -f drizzle/0001_wallet_and_paystack.sql`
   (there was no drizzle-kit config in the repo before this — I added
   `drizzle.config.ts` too, so `npm run db:generate` / `db:migrate` work for
   future schema changes.)
3. Copy `.env.example` to `.env.local` and fill in `PAYSTACK_SECRET_KEY`
   (test key from dashboard.paystack.com) plus the existing `DATABASE_URL` /
   `BETTER_AUTH_URL`.
4. Register the webhook URL in the Paystack dashboard.

## 4. What I did NOT change

- Responsiveness: the existing Tailwind/shadcn layout is already
  mobile-first (breakpoint classes throughout `sm:`/`md:`/`lg:`) — I didn't
  find anything broken on mobile, so I left it as-is rather than
  rewriting working code. Worth a manual pass on a real device before launch.
- The dispute-resolution logic, review system, and rest of the transaction
  lifecycle are untouched — they didn't need to change for either piece of
  this work.
- I did not add a refund path through Paystack (Paystack refunds are a
  separate API call, initiated by an admin after a dispute resolves in the
  buyer's favor). Flagging this because your dispute flow currently marks a
  transaction `refunded` in the DB without actually moving money back — that
  gap existed before my changes and still needs a real implementation.

## 5. On "fully decentralized"

Worth being upfront: what's built here is wallet-based *identity* (you sign
in by proving control of an address, not a password) with payments still
running through a centralized fiat rail (Paystack) and a centralized
Postgres database holding transaction state. That matches what you asked
for (hybrid), but it's not decentralized in the stronger sense of "funds
custody is enforced by a smart contract, not by this app's database." If you
want that version later — an actual escrow smart contract holding the funds
on-chain instead of Postgres tracking a `status` column — that's a
meaningfully different (and bigger) build: a Solidity contract, a deployment
pipeline, and on-chain payment in crypto instead of Naira via Paystack. Say
the word if that's the direction you want to go next.
