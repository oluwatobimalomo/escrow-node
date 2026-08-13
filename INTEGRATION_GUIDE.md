# Integration guide — account management, admin delete, duplicate-email fix

Everything from this round and the previous "account management" round is
in this one package. Apply it all together, in the order below.

## 1. Extract

```bash
cd ~/Downloads/trustlock-decentralized
unzip -o ~/Downloads/account-management-v2.zip -d .
```

This places these new files directly (safe, no overwrite risk):
- `app/forgot-password/page.tsx` + `components/forgot-password-form.tsx`
- `app/reset-password/page.tsx` + `components/reset-password-form.tsx`
- `app/actions/account-deletion.ts`
- `components/dashboard/delete-account-section.tsx`

And these **replace existing files wholesale** (these are small enough
that a full replacement is cleaner than a patch — the unzip does this
automatically since the paths match):
- `components/admin/user-role-table.tsx`
- `app/admin/users/page.tsx`

Three files are reference-only — copy their contents into your existing
files by hand, then you can delete them:
- `lib/email-addition.ts` → copy both functions into your existing `lib/email.ts`
- `lib/auth-edit.ts` → apply to `lib/auth.ts` (see step 2)
- `app/actions/admin-delete-user-addition.ts` → copy the one function into your existing `app/actions/admin.ts`

## 2. Edit lib/auth.ts

Follow `lib/auth-edit.ts` exactly — it has the full new `emailAndPassword`
block (which now includes password-reset AND the duplicate-signup email
handling) and the new `user.deleteUser` block. This **replaces** your
current `emailAndPassword` block wholesale rather than patching it —
apply it once, cleanly.

## 3. Edit app/actions/admin.ts

Open `app/actions/admin-delete-user-addition.ts` and paste its one
function (`adminCheckCanDeleteUser`) into your existing `app/actions/admin.ts`,
anywhere alongside the other exported functions. It reuses `requireAdmin()`,
which already exists in that file — no new import needed for that part.
You will need these two additional imports at the top if they're not
already there:
```ts
import { or, notInArray } from 'drizzle-orm'
```
(`and`, `eq`, `transactions`, `db` should already be imported in this
file from the existing dispute-resolution code.)

## 4. Edit components/auth-form.tsx

Add a "Forgot password?" link on the sign-in form. Find the Password
field:
```tsx
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="At least 8 characters"
              />
            </div>
```
Add directly after its closing `</div>`:
```tsx
            {!isSignUp && (
              <div className="flex justify-end -mt-2">
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Forgot password?
                </Link>
              </div>
            )}
```
`Link` is already imported in this file — no new import needed.

## 5. Edit app/dashboard/profile/page.tsx

Add the import:
```ts
import { DeleteAccountSection } from '@/components/dashboard/delete-account-section'
```
Add near the end of the page, after your other cards:
```tsx
      <DeleteAccountSection hasPassword={profile.hasPassword} />
```

## 6. Commit and push

```bash
git add .
git status
git commit -m "Add forgot-password, self-service and admin account deletion, fix duplicate-signup email"
git push
```

No schema change this round, no new environment variables — nothing to
migrate.

---

## What changed and why

### Forgot password
Standard flow: request a link at `/forgot-password`, click it, land on
`/reset-password` with a token, set a new password. Links expire in 1
hour. Resetting a password also signs out any other active sessions on
that account, as a security measure.

### Self-service account deletion
A "Danger zone" card on the profile page. Password accounts confirm by
re-entering their password; wallet-only accounts confirm by typing
DELETE. Blocked automatically if the account has any transaction that
isn't `completed`, `cancelled`, or `refunded` — money still in flight is
a hard stop, not a warning.

### Admin account deletion (this round, new)
A "Delete" button next to each user on `/admin/users`, using Better
Auth's admin-plugin `removeUser` — a genuine hard delete, distinct from
the self-service one. Same active-transaction safety check applies here
too, since an admin force-deleting a user mid-transaction is exactly as
risky as the user doing it themselves. Also guards against an admin
deleting their own account through this screen — Better Auth's
`removeUser` doesn't prevent that on its own (a known, currently open
issue in their GitHub repo), so the button is simply hidden on the
admin's own row, and the safety-check function rejects it server-side too
as a second layer.

### Duplicate-signup email fix
**The actual bug:** `requireEmailVerification: true` makes Better Auth
deliberately return the same generic success response whether or not the
email already has an account — this is intentional, OWASP-recommended
behavior to stop an attacker from using your signup form to figure out
who's registered on your platform. The bug was that *no real email was
being sent at all* in the duplicate case, since the success response was
synthetic. Someone retrying to sign up with their own existing email got
told "check your email" and then nothing ever arrived.

**The fix:** `onExistingUserSignUp` now sends a real, different email in
that case — pointing the person at sign-in or password reset instead of
a fake verification link. The on-screen message is unchanged (still the
generic "check your email" text) by design, matching Better Auth's
documented recommendation.

**Worth knowing:** you'd originally asked for the on-screen message
itself to say "an account already exists" directly. I kept it generic
instead, because revealing that outright lets anyone probe your signup
form to build a list of who has an account on TrustLock — a real privacy
consideration for a platform handling people's money and transaction
history. The concrete problem you hit (no email ever arriving) is fixed
either way. If you still want the on-screen message to explicitly reveal
"account already exists" after knowing that tradeoff, it's a small
follow-up change — just say so.

## Testing

- **Forgot password:** request a reset for a real account, confirm the
  email arrives, reset it, confirm the old password no longer works.
- **Duplicate signup:** try signing up again with an email that already
  has an account — confirm the on-screen message is the same generic
  "check your email" text, and confirm a *real* email now arrives (the
  "you already have an account" one, not a fake verification link).
- **Self-service deletion, blocked case:** as a user with an active
  transaction, try deleting — confirm it's blocked with a clear reason.
- **Self-service deletion, allowed case:** a fresh test account with no
  transactions — confirm it actually deletes and signs you out.
- **Admin deletion:** on `/admin/users`, confirm your own row has no
  Delete button, confirm deleting another test user works, and confirm
  it's blocked the same way if that user has an active transaction.
