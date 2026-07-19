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