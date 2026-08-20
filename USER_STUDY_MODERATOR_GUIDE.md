# TrustLock User Study — Moderator Guide (v2)

This supersedes the **task list** in the original facilitator materials
(Section 3). Recruitment, consent, screening questions, the SUS/Trust/
Qualitative instruments, and the scoring guide are all **unchanged** — keep
using those sections as written. Nothing about the questionnaire wording
changes here.

What changed since the original materials were written: the app now has a
persistent sidebar (not a single top bar), a **marketplace** where sellers
list items for others to browse and buy directly, and a few flows that were
previously broken are now working (forgot password, in particular). The
task list below reflects the app as it stands today and closes a gap in the
original design — the questionnaire already asks participants to rate
their trust in marketplace listings, but the old task list never had
anyone actually use the marketplace. Fixed below.

---

## 1. Before sessions start: seed the marketplace

Buyer-track participants need real listings to browse — don't make the
first buyer session depend on a seller session having already run.

Using a dedicated facilitator/test account (not a participant's), publish
**2–3 throwaway listings** before your first session:
`Marketplace` (sidebar) → `Sell something` → fill in title, price,
quantity, an optional photo → `Publish listing`. Takes under a minute
each.

## 2. The four tracks

Assign each participant to one track. This crosses the two things the
study already cares about — identity method, and role — into four
conditions:

| Track | Identity method | Role |
|---|---|---|
| A | Email + password | Buyer |
| B | Email + password | Seller |
| C | Wallet (MetaMask) | Buyer |
| D | Wallet (MetaMask) | Seller |

Use a participant ID that encodes the track for later filtering, e.g.
`P07-A`, `P08-C`. Aim for roughly even numbers across all four if your
total sample allows it (with 15–25 participants, 4–6 per track is
reasonable — don't force exact evenness at the cost of recruitment).

Every participant gets the **same post-task questionnaire** regardless of
track (Section 4 of the original materials, unchanged) — the task list is
what differs, not the survey.

## 3. Session script (read or paraphrase)

Same as the original materials — reuse verbatim:

> "Thanks for helping test TrustLock, an escrow platform for online buying
> and selling. I'm going to ask you to complete a few tasks using a live
> test version of the app — no real money is involved anywhere in this
> session. Please talk through what you're thinking as you go, even if
> something seems obvious or if you get stuck — that's genuinely the most
> useful part for me. There's no wrong way to do this; I'm testing the
> app, not you."

## 4. Task lists by track

All tracks start the same way (account creation), then diverge.

### Everyone: account creation

- **Email tracks (A, B):** Sign up with email and password.
- **Wallet tracks (C, D):** Use "Continue with wallet" instead, and
  connect via MetaMask when prompted. Note for your own reference (no
  need to mention it to the participant unless they ask): the account
  still gets a system-generated placeholder value where an email would
  go, visible read-only on the Profile page. That's expected, not a bug —
  see the funding-step note under Track C for where it actually matters.

### Track A — Email, Buyer

1. Create a transaction by inviting a counterparty (use a second test
   email you control, or the facilitator's).
2. Switch to the counterparty account (or have the facilitator do this)
   and accept the transaction.
3. Fund the transaction. Test card: `4084084084084081`, any future
   expiry, CVV `408`, PIN `0000`, OTP `123456`. **Important:** Paystack's
   test checkout shows a "Success / Bank Authentication / Declined"
   selector — the participant must explicitly click **Success** before
   hitting Pay, or Paystack will simulate a real decline on purpose. Brief
   participants on this before they reach checkout, or watch for it and
   step in if they miss it — otherwise they'll see a genuine-looking
   "insufficient funds" error that has nothing to do with the app.
4. Before doing anything else, find and read the platform fee and
   expected payout timing for this transaction. Don't prompt where to
   look — this tests discoverability.
5. Go to **Marketplace** in the sidebar, pick any listing, and buy it.
   Notice that funding is the only step left — there's no separate
   "accept" step, since the seller already committed to the price by
   listing it.
6. Raise a dispute on either transaction and look at what options are
   available to resolve it.
7. Find another user's public profile and look at their reputation
   (rating, completed deals, verification badges) before you'd
   hypothetically transact with them.
8. *(Optional)* Try "Forgot password?" from the sign-in page end to end.

### Track B — Email, Seller

1. Go to **Marketplace → Sell something**. Publish a listing: title,
   description, a photo, price, and quantity.
2. Have the facilitator (or a second test account) buy that listing.
   Notice you weren't asked to separately "accept" — funding is next.
3. Once funded, find it in **Dispatch products** and mark it shipped.
4. Create a second transaction the old way — invite a counterparty by
   email directly, rather than through a listing.
5. Go to **Payments** in the sidebar. Add payout/bank account details,
   and look at what the payout history/ledger shows once a sale
   completes.
6. Find another user's public profile and look at their reputation.
7. *(Optional)* Try "Forgot password?" from the sign-in page end to end.

### Track C — Wallet, Buyer

Same as Track A, with one specific thing to watch for: wallet-only
accounts get a system-generated placeholder value in place of an email.
At the **"Fund escrow"** step, the "Email for receipt" field is
pre-filled with that placeholder — watch whether the participant notices
it's not a real address and replaces it before paying. If they don't
notice, gently point it out rather than letting them submit a payment
that has nowhere to send the receipt — this is a genuine discoverability
question worth a note in your observations either way, not something to
silently fix for them.

### Track D — Wallet, Seller

Same as Track B. The placeholder-email note above doesn't apply here
directly (sellers don't hit that dialog), but keep an eye out on the
**Payments** page, where a payout account still requires real bank
details regardless of identity method.

### All tracks, optional, time permitting

- Try "Verify identity" under **Profile** with the test BVN
  `22222222222`.
- Under **Profile**, notice the profile photo is required to save
  changes — try saving without one first, then with one.

## 5. Post-task questionnaire

Unchanged — administer Section 4 of the original materials exactly as
written (SUS, Trust, Qualitative). Record the participant's track (A/B/C/D)
alongside their responses so results can be split by identity method and
by role during analysis.

## 6. Scoring and write-up

Unchanged — Section 5 and 6 of the original materials apply as written.
One addition worth doing given the new track split: report SUS and trust
means **both overall and broken out by track**, since a meaningful
difference between email vs. wallet or buyer vs. seller conditions would
be a real finding worth a sentence or two in the discussion, even if the
sample per track is too small for statistical significance.
