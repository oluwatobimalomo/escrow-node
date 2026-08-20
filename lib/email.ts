function baseUrl() {
  const url =
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000')
  return url.startsWith('http') ? url : `https://${url}`
}

function apiKey() {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error(
      'RESEND_API_KEY is not set. Add it to your environment to send emails.',
    )
  }
  return key
}

/**
 * The address Resend sends from. Resend's own onboarding@resend.dev works
 * without any domain setup, but only delivers to the email address you
 * signed up with — fine for testing, not for real users. Once you verify a
 * domain in the Resend dashboard, set RESEND_FROM_EMAIL to something like
 * "TrustLock <noreply@yourdomain.com>".
 */
function fromAddress() {
  return process.env.RESEND_FROM_EMAIL ?? 'TrustLock <onboarding@resend.dev>'
}

export async function sendEmail(args: {
  to: string
  subject: string
  html: string
  attachments?: { filename: string; content: string }[] // content = base64
}) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromAddress(),
      to: args.to,
      subject: args.subject,
      html: args.html,
      ...(args.attachments ? { attachments: args.attachments } : {}),
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('Resend send failed:', res.status, body)
    throw new Error('Could not send email')
  }
}

export function verificationEmailHtml(url: string) {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Verify your email</h2>
      <p style="color: #444; line-height: 1.5;">
        Click the button below to verify your email address and activate your
        TrustLock account.
      </p>
      <p style="margin: 24px 0;">
        <a href="${url}"
           style="background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Verify email
        </a>
      </p>
      <p style="color: #888; font-size: 13px;">
        If the button doesn't work, copy and paste this link:<br />
        <a href="${url}" style="color: #888;">${url}</a>
      </p>
      <p style="color: #888; font-size: 13px;">
        If you didn't create a TrustLock account, you can ignore this email.
      </p>
    </div>
  `
}

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

export function accountDataExportEmailHtml() {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">Your TrustLock data</h2>
      <p style="color: #444; line-height: 1.5;">
        As requested, your TrustLock account is being deleted. Attached is
        a copy of your data — profile details, transaction history, reviews,
        and payout account — as it stood just before deletion.
      </p>
      <p style="color: #444; line-height: 1.5;">
        This is the only copy we'll have going forward; TrustLock's own
        records of your personal information will be removed shortly. If
        you didn't request this, please contact support right away.
      </p>
      <p style="color: #888; font-size: 13px;">
        Thanks for having used TrustLock. We're sorry to see you go.
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
  const url = baseUrl()
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #111;">You already have a TrustLock account</h2>
      <p style="color: #444; line-height: 1.5;">
        Someone just tried to create a new account using this email
        address, but you already have one. If this was you, no need to
        sign up again — just sign in instead.
      </p>
      <p style="margin: 24px 0;">
        <a href="${url}/sign-in"
           style="background: #111; color: #fff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
          Sign in
        </a>
      </p>
      <p style="color: #444; line-height: 1.5;">
        Forgot your password?
        <a href="${url}/forgot-password" style="color: #111;">Reset it here</a>.
      </p>
      <p style="color: #888; font-size: 13px;">
        If this wasn't you, you can safely ignore this email — your
        account is unaffected.
      </p>
    </div>
  `
}