# Profiles — how to apply this

Same pattern as the admin round. From your project root:

```bash
cd ~/Downloads/trustlock-decentralized
unzip -o ~/Downloads/profile-feature-files.zip -d .
```

`-o` overwrites the 3 files that already exist (`lib/db/schema.ts`,
`app/dashboard/layout.tsx`, `app/dashboard/transactions/[id]/page.tsx`) and
adds the 6 new ones.

## What this adds

- **`/dashboard/profile`** — your own account page: edit name, bio, and an
  avatar (paste an image URL — there's no file upload wired in, no blob
  storage configured for this project yet), view linked wallet(s)
  read-only, change password (hidden entirely if your account has no
  password — i.e. you signed up wallet-only).
- **`/dashboard/users/[id]`** — the public-facing version: name, avatar,
  bio, member-since date, average rating + review count, completed-deals
  count, verified badges (email, wallet), and recent reviews. Visible to
  any signed-in user, not the open internet — someone still needs an
  account to look someone up, matching how the rest of the app is gated.
- Buyer/seller names on the transaction detail page, and reviewer names on
  the reviews list, now link to that person's public profile — so before
  accepting an invite or funding a transaction, you can actually check who
  you're dealing with. That's the trust-signal use case from your original
  ask.

## Steps

**1. Schema change — one new column (`bio` on `user`):**
```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```
Confirm it landed the same way as last time:
```bash
node --env-file=.env.local -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: process.env.DATABASE_URL }); pool.query(\"SELECT column_name FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'bio'\").then((res) => { console.log(res.rows); return pool.end(); }).catch((err) => { console.error('Failed:', err.message); return pool.end(); });"
```

**2. Commit and push:**
```bash
git add .
git status   # confirm the expected file list before committing
git commit -m "Add profile pages (own settings + public reputation view)"
git push
```

**3. Run the same migration against production** once deployed — same
caveat as every schema change: `drizzle-kit migrate` only touches whatever
`DATABASE_URL` is active in your current shell.

## Known limitations, on purpose (scope calls, not bugs)

- **No avatar upload** — URL only. Adding real upload needs file storage
  (Vercel Blob, S3, etc.) that isn't set up in this project. Worth doing if
  people actually want to upload a photo rather than link one.
- **No way to link an additional wallet from the profile page** — wallets
  are currently only linkable at sign-in (SIWE creates the link as a side
  effect of signing in with that address). Linking a second wallet to an
  already-logged-in account is a distinct flow Better Auth's SIWE plugin
  supports, just not wired up here yet.
- **No "add a password" flow for wallet-only accounts** — `changePassword`
  needs a current password to exist, so it's hidden entirely for accounts
  that signed up wallet-only. If someone wants to add email/password login
  to a wallet-only account later, that's a separate small feature.
