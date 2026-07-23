# Rate limiting + email notifications — how to apply this

```bash
cd ~/Downloads/trustlock-decentralized
unzip -o ~/Downloads/rate-limit-notify-files.zip -d .
```

Overwrites 11 existing files. No new files this round — everything plugs
into what's already there.

## What this adds

### Rate limiting — industry-standard tiered approach

- **Auth endpoints** (sign-in, sign-up, SIWE verify, password reset,
  resend-verification) — handled by **Better Auth's own built-in rate
  limiter** (`lib/auth.ts`), backed by your Postgres database rather than
  in-memory, so it actually persists across separate serverless
  invocations. 5 attempts/minute on the brute-forceable ones, generous
  defaults elsewhere.
- **Money-moving actions** (funding, refunds, admin dispute resolution,
  confirming delivery, adding/changing a payout account) — 5
  requests/minute per user, via a new **Upstash Redis**–backed limiter.
  This is the standard approach for serverless apps on Vercel specifically
  — Vercel's functions are stateless between invocations, so an in-memory
  rate limiter wouldn't actually work; Upstash is the standard pairing
  here (official Vercel integration, generous free tier).
- **Webhook/cron endpoints** — 30 requests/minute, keyed by source rather
  than user, since these are hit by Paystack/Vercel's scheduler rather
  than a logged-in person.
- **Everything else authenticated** (creating a transaction, raising a
  dispute, shipping, accepting, cancelling, submitting a review, editing
  your profile) — 30 requests/minute per user, mainly to blunt scripted
  abuse rather than constrain normal usage.

**Fails open if unconfigured** — if `UPSTASH_REDIS_REST_URL`/`_TOKEN`
aren't set, the custom rate limiter allows all requests rather than
breaking the app. Fine for local dev; **not fine for production** — set
these before this matters for real.

### Email notifications — every status change, both parties

New central `lib/notify.ts`, called at every transition point across
`app/actions/transactions.ts`, `app/actions/admin.ts`, and the payout cron:
invited, accepted, funded, shipped, delivered/completed, cancelled,
disputed, dispute resolved (mutual or admin-forced), and payout sent.
Notifications are deliberately **best-effort** — a failed send never blocks
or surfaces an error on the underlying action; it just logs and moves on.

## Setup

**1. Create an Upstash Redis database** (free tier is plenty for this):
   - [upstash.com](https://upstash.com) → sign up → Create Database →
     Regional (not Global, no need for multi-region here) → any region
     close to where your Vercel deployment runs (`iad1` = us-east-1, so a
     US-East Upstash region is the natural match).
   - On the database's page, find the **REST API** section — copy the
     `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` values shown
     there directly (not the Redis connection string — this uses Upstash's
     REST API, not a raw Redis protocol connection).

**2. Add to Vercel** (Settings → Environment Variables, same as every
   other key this session):
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

   (`CRON_SECRET` and `PLATFORM_FEE_PERCENT` should already be set from
   the payouts round — if you skipped that or aren't sure, check they're
   there too; `.env.example` now documents all of these together.)

**3. No schema change this round** — nothing to migrate. Straight to:
```bash
git add .
git status
git commit -m "Add rate limiting (Upstash) and email notifications for all status changes"
git push
```

## Testing this

**Rate limiting:** the easiest test is the auth side, since it needs no
extra state — try signing in with a wrong password 6 times in under a
minute; the 6th should get blocked with a clear rate-limit message rather
than a normal "wrong password" error. For the money tier, rapidly clicking
"Fund escrow" or hitting a server action 6 times in a minute should trigger
`Too many requests. Try again in Ns.`

**Notifications:** walk one transaction through its full lifecycle (create
→ accept → fund → ship → confirm delivery) with two real test accounts and
confirm both inboxes get the expected email at each step — remembering the
existing Resend sender-restriction limitation still applies here
(currently only delivers to your own Resend account email, since domain
verification was deliberately skipped for now). Also worth testing a
dispute end to end (raise → resolve, both the mutual-consent and
admin-forced paths) since those are the two places most likely to have a
subtle wiring gap given how many outcome branches they have.

## One thing worth deciding later, not now

Notifications currently always fire in English with no way to opt out —
worth a "notification preferences" setting eventually if this grows past
you and testers, but not worth building ahead of actual demand for it.
