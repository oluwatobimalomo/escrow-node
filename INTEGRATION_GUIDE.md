# BVN verification via Dojah — how to apply this

```bash
cd ~/Downloads/trustlock-decentralized
unzip -o ~/Downloads/bvn-dojah.zip -d .
```

This **replaces two existing files wholesale** (the unzip does this
automatically since the paths match) and **adds one new file**:

- `components/dashboard/bvn-verification-form.tsx` — replaced. Was
  showing the "temporarily unavailable" notice; now the real interactive
  form again. No other file needs to change to pick this up — the
  profile page already renders this component with the right props from
  when it was disabled.
- `app/actions/kyc.ts` — replaced. Same function name and signature
  (`verifyBvnIdentity`) as the old Paystack-based version, just calling
  Dojah underneath instead.
- `lib/dojah.ts` — new. The actual API client.

**No schema change, no migration.** This reuses the `bvnVerified` /
`bvnVerifiedAt` / `bvnVerifiedName` columns already sitting in your `user`
table from the original BVN round — they were never removed when the
feature was disabled, just unused.

## Setup — required before this works at all

**1. Create a Dojah account** at dojah.io, then go to your dashboard →
Settings → API Keys. You'll get an **App ID** and a **Secret Key**.

**2. Confirm one thing in your own dashboard before testing** — flagged
directly in `lib/dojah.ts` too: Dojah's docs site was mid-restructure
when this was built, so I couldn't fully pin down today's exact BVN
lookup endpoint path with full certainty (everything else — the auth
header format, the response shape, the sandbox test value below — is
confirmed directly from their docs, just not that one path). Once you're
signed in, your dashboard's own API reference shows copy-pasteable code
with your exact endpoint filled in, under **Verify Individual →
Government Data Lookup**. Compare that against the `DOJAH_BVN_PATH`
constant at the top of `lib/dojah.ts` — if it's different, just edit that
one constant, nothing else in the file needs to change.

**3. Add environment variables** — see `env-additions.txt` in this zip
for the exact three to add, both locally (`.env.local`) and in Vercel
(Settings → Environment Variables, same as every other key this
session — and same reminder as always: check it's scoped to the right
environment, since that's bitten this build more than once).

**4. Commit and push:**
```bash
git add .
git status
git commit -m "Rebuild BVN verification against Dojah"
git push
```

## Testing — use Dojah's real documented sandbox value

Dojah publishes a fixed test BVN for sandbox testing:
```
BVN: 22222222222
```
Use this against whatever test name/DOB your sandbox account returns for
it (check your Dojah dashboard's sandbox test data page — it may show a
specific name/DOB pairing to use alongside this BVN, since the code here
checks that the DOB you enter matches what Dojah returns). If the sandbox
returns a different DOB than what you enter, you'll see the "date of
birth doesn't match" error — that's the code working correctly, not a
bug; just enter whatever DOB your sandbox dashboard shows for that test
BVN.

**What to check:**
- Successful match → shows the green "Identity verified as [name]" badge
  immediately, and that badge now also appears on the **public** profile
  view (`/dashboard/users/[id]`), not just your own settings page — this
  was already wired from the original BVN round, so it should just work.
- Wrong DOB → clear error message, no false "verified" state.
- Try it with `DOJAH_APP_ID`/`DOJAH_SECRET_KEY` deliberately unset once,
  to confirm you get the clear "not set" error rather than a confusing
  crash — worth knowing what that failure mode looks like before you
  hit it by accident in production.

## If the endpoint path from step 2 turns out different

Update `DOJAH_BVN_PATH` in `lib/dojah.ts` and redeploy — that's the only
change needed. If the response shape also turns out different (i.e. the
field names aren't `entity.first_name` / `entity.last_name` /
`entity.date_of_birth`), paste me what your dashboard's example response
actually shows and I'll adjust `lookupBvn()` in a couple of lines — much
faster to fix with the real response in hand than to keep guessing now.
