# Admin dispute resolution — how to apply this

This zip mirrors your project's folder structure exactly. Extract it into
`trustlock-decentralized/`, letting it overwrite the 5 files it shares a
path with (`lib/auth.ts`, `lib/auth-client.ts`, `lib/db/schema.ts`,
`lib/paystack.ts`, `app/dashboard/layout.tsx`) and add the 7 new ones
(`app/actions/admin.ts`, `app/admin/**`, `components/admin/**`,
`scripts/set-admin-role.mjs`).

```bash
cd ~/Downloads/trustlock-decentralized
unzip -o ~/Downloads/admin-feature-files.zip -d .
```

(`-o` overwrites without prompting per file — fine here since every
overwritten file is one you don't have unstaged local edits in.)

## What this adds

- **Admin role**, via Better Auth's own `admin` plugin — no custom auth code,
  just configuration. Adds `role`/`banned`/`banReason`/`banExpires` to the
  `user` table.
- **`/admin/disputes`** — every open dispute, with buyer/seller/reason, and
  three resolution buttons: release to seller, full refund to buyer, or a
  split (partial refund to buyer, remainder to seller). This is the
  force-resolution path — it doesn't need the non-raising party's agreement,
  unlike the existing mutual-consent `resolveDispute`.
- **`/admin/users`** — promote/demote admins. This is how your team grows
  the admin group after the first one exists.
- **Real refund execution** for the 'refund' and 'split' outcomes, via a new
  `refundPaystackTransaction` in `lib/paystack.ts` — this actually calls
  Paystack's refund API, closing the gap flagged back in the integration
  guide. 'release' (and the seller side of a split) stays a DB-only status
  change, matching how normal (non-disputed) delivery confirmation already
  works elsewhere in the app — there's no seller-payout API wired in
  anywhere, disputed or not.
- An "Admin" button in the regular dashboard header, shown only to admins.

## Steps, in order

**1. Apply the schema change** — this time through the normal, tracked
workflow (your `drizzle/` history is clean from the last round):

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
```

**2. Bootstrap your first admin.** There's no in-app way to create the
*first* admin (chicken-and-egg — you need an admin to grant admin). Sign up
a normal account first if you haven't, then:

```bash
node --env-file=.env.local scripts/set-admin-role.mjs your-email@example.com
```

After that, sign out and back in (role is read from the session, which
won't reflect the change until it refreshes) — you should see an "Admin"
button in the dashboard header. From there, promote your teammates through
`/admin/users` instead of the script.

**3. Commit and push:**

```bash
git add .
git status   # confirm only the expected files changed
git commit -m "Add admin role and dispute force-resolution"
git push
```

Vercel redeploys automatically. Once live, **also run step 1's migration
against production** — same as every schema change, `npx drizzle-kit
migrate` only touches whatever `DATABASE_URL` is active in your shell, so
if that's still pointed at production from earlier sessions you're fine;
otherwise pull production's env first (`vercel env pull .env.local`).

## One thing to test deliberately

Create a real dispute deadlock to test this properly: two test accounts,
fund a transaction, have one party raise a dispute, and confirm the *other*
party is still blocked from unilaterally resolving it (existing mutual-
consent behavior) — then log in as admin and force-resolve it instead. That
exercises the actual reason this exists, not just that the buttons render.
