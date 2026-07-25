# Business decisions round — how to apply this

```bash
cd ~/Downloads/trustlock-decentralized
unzip -o ~/Downloads/business-updates-files.zip -d .
```

Overwrites 15 existing files, adds 4 new ones (`app/actions/kyc.ts`,
`app/pricing/page.tsx`, `app/privacy/page.tsx`,
`components/dashboard/bvn-verification-form.tsx`).

## What this covers, against your 5 points

### 1. SIWE + traditional KYC (both, not either/or)
New optional BVN verification on the profile page, alongside the existing
wallet and email verification. Deliberately does **not** store the raw BVN
— only whether it verified, when, and the matched name (NDPR
data-minimization: don't hold onto sensitive PII once you've used it for
its one-time purpose). Shows as an "ID verified" badge next to the
existing "Email verified" and "Wallet linked" badges, on both your own and
public profiles.

Uses Paystack's BVN resolve endpoint (₦10/call, 10 free/month) — checks
the BVN against a date-of-birth match, which is the verification pattern
Paystack's own docs suggest for BVN checks without a full OTP flow. A more
robust option exists (Paystack's async "Validate Customer" API, which
does full webhook-based verification) but it only works with **live**
keys, not test mode — worth upgrading to that once you're off test mode,
noted here so it's not forgotten.

### 2. Tiered pricing, visible in-app
`lib/payout.ts` now has an explicit `FEE_TIERS` schedule instead of a flat
rate:

| Amount | Fee |
|---|---|
| Up to ₦50,000 | 3% |
| ₦50,001 – ₦250,000 | 2% |
| ₦250,001 – ₦1,000,000 | 1.5% |
| Above ₦1,000,000 | 1% |

This was my judgment call at matching your "around 1.5% industry
standard" ask while still scaling down on larger transactions the way
EscrowLock's range suggested competitors do — **not something I'd treat
as final without you weighing in on the actual thresholds/rates**, easy to
adjust since it's one array in one file.

Visible in three places now: a new public `/pricing` page (linked in the
header and footer) that reads directly from `FEE_TIERS` so it can never
drift out of sync with what's actually charged; a live estimate on the
"new transaction" form when creating as a seller; and the actual
applicable fee + payout timing shown to the seller on every transaction
detail page.

**Note:** the old `PLATFORM_FEE_PERCENT` env var is no longer read — safe
to remove it from Vercel's environment variables if you'd set it, though
leaving it there is harmless too since nothing references it anymore.

### 3. Fund custody
No code change — you're exploring this with finance contacts, as
discussed. Nothing here blocks or assumes an outcome either way.

### 4. General-purpose, made visible
Landing page copy updated throughout — hero now explicitly names the
three verticals ("Physical goods", "Freelance & digital services", "SME
B2B trade") as badges under the CTA, the features section leads with that
framing instead of goods-only language, and the how-it-works steps no
longer say "ships"/"dispatches" exclusively — now covers shipping,
completed work, or service delivery.

### 5. NDPR compliance + payout window visibility
New `/privacy` page — a solid working draft aligned to the Nigeria Data
Protection Act 2023, covering what's actually collected (including the
BVN non-retention detail from #1), why, who it's shared with (Paystack,
Resend, Vercel, Neon), retention, and user rights. **This needs a lawyer's
review before you rely on it publicly** — it's genuinely a good starting
draft, not a substitute for actual legal review, and it has two
placeholders (`[DATE]`, `[PRIVACY CONTACT EMAIL]`) you need to fill in.
Linked in the footer.

The 48-hour payout cooling-off window is now visible in four places: the
`/pricing` page, the how-it-works step on the landing page, the
new-transaction form (sellers see it before they even create the
transaction), and the transaction detail page itself (shows the actual
scheduled date/time once a payout is scheduled, not just the policy).

## Setup

**1. Schema — 3 new columns on `user`** (`bvnVerified`, `bvnVerifiedAt`,
`bvnVerifiedName`):
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
Verify, same as every round:
```bash
node --env-file=.env.local -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'bvnVerified'\").then((res) => { console.log(res.rows); return pool.end(); }).catch((err) => { console.error('Failed:', err.message); return pool.end(); });"
```

**2. Fill in the two placeholders in `app/privacy/page.tsx`** before
deploying — search for `[DATE]` and `[PRIVACY CONTACT EMAIL]`.

**3. Commit, push, migrate production — same sequence as every round:**
```bash
git add .
git status
git commit -m "Add KYC verification, tiered pricing, general-purpose positioning, NDPR privacy policy"
git push
```
Then repeat step 1's migration against production.

## Testing

- Visit `/pricing` and `/privacy` on the deployed site — confirm they
  render and the fee table matches what's actually charged (spot-check
  against a real completed transaction's `platformFeeAmount`).
- On the new-transaction form, select "Seller" and enter an amount —
  confirm the live fee estimate appears and updates as you change the
  amount, and crosses tier boundaries correctly (try ₦49,000 vs
  ₦51,000 to see the rate step down).
- On your profile, try BVN verification with a real BVN + correct DOB —
  confirm it shows the verified badge and that a wrong DOB is rejected
  with a clear error rather than silently "verifying."
- Confirm the BVN badge shows up on your **public** profile
  (`/dashboard/users/[your-id]`) too, not just your own settings page.
