# TrustLock User Study — Moderator Guide

## 1. Before sessions start

**Seed the marketplace.** Buyer-track participants need real listings to
browse. Using a dedicated facilitator/test account, publish 2–3
throwaway listings before your first session: `Marketplace` (sidebar) →
`Sell something` → fill in title, price, quantity, an optional photo →
`Publish listing`.

**Prep wallet-track devices.** "Continue with wallet" requires a browser
extension wallet — it does not work in a phone's regular browser
(Safari/Chrome). Before each Track C or D session starts, confirm the
participant has one of:

- A laptop/desktop with the MetaMask browser extension installed, or
- A phone with the MetaMask app installed, opening the study URL from
  inside MetaMask's own in-app browser (MetaMask app → Browser tab →
  enter the URL), not their phone's regular browser.

Have a facilitator laptop with MetaMask installed on hand as a fallback.

**Recruitment, consent, and screening** questions are documented in the
accompanying study materials — follow those as written.

## 2. The four tracks

Assign each participant to one track, crossing identity method and role:

| Track | Identity method | Role |
|---|---|---|
| A | Email + password | Buyer |
| B | Email + password | Seller |
| C | Wallet (MetaMask) | Buyer |
| D | Wallet (MetaMask) | Seller |

Use a participant ID that encodes the track, e.g. `P07-A`, `P08-C`. Aim
for 4–6 participants per track across a total sample of 15–25.

Every participant completes the same post-task questionnaire (SUS,
Trust, Qualitative — see the accompanying study materials) regardless of
track. Only the task list differs.

## 3. Session script (read or paraphrase)

> "Thanks for helping test TrustLock, an escrow platform for online buying
> and selling. I'm going to ask you to complete a few tasks using a live
> test version of the app — no real money is involved anywhere in this
> session. Please talk through what you're thinking as you go, even if
> something seems obvious or if you get stuck — that's genuinely the most
> useful part for me. There's no wrong way to do this; I'm testing the
> app, not you."

## 4. Task lists by track

All tracks start the same way, then diverge.

### Everyone: account creation

- **Email tracks (A, B):** Sign up with email and password.
- **Wallet tracks (C, D):** Use "Continue with wallet" and connect via
  MetaMask.

### Track A — Email, Buyer

1. Create a transaction by inviting a counterparty (use a second test
   email you control, or the facilitator's).
2. Switch to the counterparty account (or have the facilitator do this)
   and accept the transaction.
3. Fund the transaction. Use Transfer as the payment method. If
   demonstrating Card instead: test card `4084084084084081`, any future
   expiry, CVV `408`, PIN `0000`, OTP `123456` — explicitly select
   **Success** on the option shown before paying, and fall back to
   Transfer if it declines.
4. Before doing anything else, find and read the platform fee and
   expected payout timing for this transaction. Don't prompt where to
   look — this tests discoverability.
5. Go to **Marketplace** in the sidebar, pick any listing, and buy it.
   There's no separate "accept" step here — the seller already
   committed to the price by listing it, so funding is the only step
   left.
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
   There's no separate "accept" step — funding is next.
3. Once funded, find it in **Dispatch products** and mark it shipped.
4. Create a second transaction the direct way — invite a counterparty by
   email, rather than through a listing.
5. Go to **Payments** in the sidebar. Add payout/bank account details,
   and look at what the payout history shows once a sale completes.
6. Find another user's public profile and look at their reputation.
7. *(Optional)* Try "Forgot password?" from the sign-in page end to end.

### Track C — Wallet, Buyer

Same as Track A. One specific thing to watch for: wallet-only accounts
get a system-generated placeholder value where an email would go. At
the "Fund escrow" step, the "Email for receipt" field is pre-filled with
that placeholder — watch whether the participant notices it's not a
real address and replaces it before paying. If they don't notice,
gently point it out rather than letting them submit a payment with
nowhere to send the receipt. Note this in your observations either way.

### Track D — Wallet, Seller

Same as Track B. Keep an eye on the **Payments** page, where a payout
account still requires real bank details regardless of identity method.

### All tracks, optional, time permitting

- Try "Verify identity" under **Profile** with the test BVN
  `22222222222`.
- Under **Profile**, notice the profile photo is required to save
  changes — try saving without one first, then with one.

## 5. Post-task questionnaire

Administer the SUS, Trust, and Qualitative instruments exactly as
written in the accompanying study materials. Record the participant's
track (A/B/C/D) alongside their responses so results can be split by
identity method and by role during analysis.

## 6. Scoring and write-up

Follow the scoring guide in the accompanying study materials. Report SUS
and trust means both overall and broken out by track — a meaningful
difference between email vs. wallet or buyer vs. seller conditions is
worth noting in the discussion, even if the per-track sample is too
small for statistical significance.
