// --- ADD THIS FUNCTION to your existing lib/email.ts ---
// (alongside the existing verificationEmailHtml function — don't replace
// the whole file, just add this export)

export function resetPasswordEmailHtml(url: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Reset your password</h2>
      <p style="color: #444; line-height: 1.5;">
        Someone requested a password reset for your TrustLock account. If
        this was you, click the button below to choose a new password.
        This link expires in 1 hour.
      </p>
      <p style="margin: 24px 0;">
        <a href="${url}"
           style="background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="color: #888; font-size: 13px;">
        If the button doesn't work, copy and paste this link:<br />
        <a href="${url}" style="color: #888;">${url}</a>
      </p>
      <p style="color: #888; font-size: 13px;">
        If you didn't request this, you can safely ignore this email —
        your password will not be changed.
      </p>
    </div>
  `
}

// Sent instead of a verification email when someone tries to sign up with
// an email that already has an account. The on-screen message in the app
// stays the same generic "check your email" text either way — this is
// deliberate (see the note where this is wired into lib/auth.ts) — but the
// actual email content differs, so someone who owns the address gets
// pointed at sign-in / password reset instead of a verification link.
export function existingAccountEmailHtml() {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">You already have a TrustLock account</h2>
      <p style="color: #444; line-height: 1.5;">
        Someone just tried to create a new account using this email
        address, but you already have one. If this was you, no need to
        sign up again — just sign in instead.
      </p>
      <p style="margin: 24px 0;">
        <a href="https://trustlock.site/sign-in"
           style="background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Sign in
        </a>
      </p>
      <p style="color: #444; line-height: 1.5;">
        Forgot your password?
        <a href="https://trustlock.site/forgot-password" style="color: #111;">Reset it here</a>.
      </p>
      <p style="color: #888; font-size: 13px;">
        If this wasn't you, you can safely ignore this email — your
        account is unaffected.
      </p>
    </div>
  `
}
