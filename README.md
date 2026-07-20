# Seller payouts — how to apply this

Same pattern as the last two rounds:

```bash
cd ~/Downloads/trustlock-decentralized
unzip -o ~/Downloads/payout-feature-files.zip -d .
```

Overwrites 5 existing files (`lib/db/schema.ts`, `lib/paystack.ts`,
`app/actions/transactions.ts`, `app/actions/admin.ts`,
`app/dashboard/profile/page.tsx`) and adds 5 new ones, including a
top-level `vercel.json` — you didn't have one before, so this is a clean
add, not a merge.

## What this actually does

- **Fee + payout calculation** (`lib/payout.ts`): every completed sale now
  computes a platform fee (default 5%, override with `PLATFORM_FEE_PERCENT`)
  and schedules the remainder for the seller, 48 hours out.
- **Sellers add a bank account in their profile** — new "Payout account"
  card on `/dashboard/profile`. Picks a bank from Paystack's own bank list,
  verifies the account number resolves to a real name via Paystack (shown
  back for confirmation before saving), then registers it as a Paystack
  transfer recipient.
- **A daily cron job** (`/api/cron/process-payouts`, wired via
  `vercel.json`) finds every transaction whose 48-hour window has passed
  and actually sends the money — a real Paystack transfer, not a status
  flip. If the seller hasn't added bank details yet, it marks the
  transaction `blocked_no_bank_details` and emails them a reminder instead
  of silently doing nothing.
- **Admin dispute resolution now schedules real payouts too** — "release"
  schedules the full (fee-deducted) amount to the seller; "split" schedules
  whatever's left after the buyer's refund. Previously "release" was just a
  status change with no money ever actually moving.

## Required setup — these are Paystack account settings, not code

**This is the step most likely to trip you up, so read it before testing:**

1. **Enable Transfers.** Paystack dashboard → Settings → Preferences →
   confirm Transfers is switched on for your account. Some account types
   need this manually approved by Paystack support before it's usable —
   check the dashboard for any pending-verification banner.
2. **Turn off OTP for API-initiated transfers.** By default, Paystack asks
   for an OTP to finalize a transfer — sent to your phone, meant for a
   human clicking a button. A cron job can't answer an OTP prompt, so any
   transfer will sit stuck in a pending/otp-required state forever unless
   this is disabled. This is in Settings → Preferences as well;
   depending on your account, it may require Paystack support to flip
   for you (some business types have this enforced and can't disable it —
   worth confirming with them directly if you don't see the toggle).
3. **Fund your Paystack balance for testing.** Transfers pull from
   Paystack's own balance for your account, which is built from settled
   payments (funds from a charge don't land in transferable balance
   instantly — there's a settlement delay, typically T+1/T+2, even in test
   mode this can behave differently). In **test mode**, Paystack gives you
   fake test bank accounts/recipients that work without needing a real
   settled balance — check
   [Paystack's test data docs](https://paystack.com/docs/payments/test-payments)
   for current test account numbers, since this is exactly the kind of
   detail that could have changed since I last confirmed it.

## Steps

**1. Schema — 5 new columns on `transactions`, 1 new table (`payoutAccounts`):**
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
Verify, same as every round:
```bash
node --env-file=.env.local -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'payoutStatus'\").then((res) => { console.log(res.rows); return pool.end(); }).catch((err) => { console.error('Failed:', err.message); return pool.end(); });"
```

**2. Add two new environment variables in Vercel** (Settings → Environment
Variables, same place as `PAYSTACK_SECRET_KEY` before):
   - `CRON_SECRET` — any long random string you generate yourself (e.g.
     `openssl rand -hex 32`). Vercel automatically sends this as a bearer
     token when it triggers the cron job — you don't call it manually, this
     is just the shared secret that proves a request actually came from
     Vercel's scheduler and not a random person hitting the URL.
   - `PLATFORM_FEE_PERCENT` — optional, defaults to `5` if unset.

**3. Commit and push, same as always:**
```bash
git add .
git status
git commit -m "Add seller payouts (Paystack Transfers + cron)"
git push
```
Then repeat step 1's migration against production the same way you've
done for every prior round.

**4. Confirm the cron job actually registered.** Vercel dashboard → your
project → **Settings** → **Cron Jobs** (or sometimes under "Functions") —
you should see `/api/cron/process-payouts` listed, scheduled for `0 6 * * *`
(6am UTC daily). **Worth checking your Vercel plan tier here** — Hobby-tier
projects are limited to once-daily cron execution, which is exactly what
this uses, so it should be fine either way; Pro unlocks more frequent
schedules if you ever want to shorten the 48-hour window.

## Testing this properly

Don't just check the UI looks right — the money-moving part is the whole
point:

1. Add a payout account in `/dashboard/profile` as a test seller — confirm
   the verify step shows a real resolved name before you're able to save.
2. Run a full transaction to `completed` (buyer confirms delivery).
3. Check the transaction now has `payoutStatus = 'scheduled'` and a
   `payoutScheduledAt` ~48 hours out (query the DB directly, same pattern
   as every verification step this session).
4. Rather than waiting 48 hours, **manually hit the cron endpoint** to test
   it end to end:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" https://escrow-node.vercel.app/api/cron/process-payouts
   ```
   (It'll only process transactions whose window has actually passed, so
   for a same-day test you'd need to temporarily back-date
   `payoutScheduledAt` in the DB, or temporarily shrink
   `PAYOUT_COOLING_OFF_HOURS` in `lib/payout.ts` to a few minutes for this
   one test, then revert it.)
5. Confirm in the Paystack dashboard (Transfers tab) that a real transfer
   shows up, and that the transaction's `payoutStatus` flipped to `'paid'`.
6. Test the no-bank-account path too: complete a transaction for a seller
   who hasn't added payout details, run the cron, confirm it lands on
   `blocked_no_bank_details` and the reminder email sends (same Resend
   sender-restriction caveat as before applies here).

## Known gaps, on purpose

- **No retry logic for failed transfers.** A `'failed'` transaction just
  sits there — nothing automatically retries it or alerts you. Worth an
  admin view of failed payouts eventually.
- **The reminder email sends every time the cron runs and finds a still-missing
  bank account** — so if someone ignores it, they get emailed daily, not
  just once. Acceptable for now, worth throttling later.
- **No payout history view for sellers** — they'd need to check individual
  transaction pages to see payout status; no single "here's everything
  you've been paid" list yet.
