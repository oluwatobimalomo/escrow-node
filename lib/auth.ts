import { betterAuth } from 'better-auth'
import { siwe, admin } from 'better-auth/plugins'
import { generateRandomString } from 'better-auth/crypto'
import { verifyMessage } from 'viem'
import { pool } from '@/lib/db'
import {
  sendEmail,
  verificationEmailHtml,
  resetPasswordEmailHtml,
  existingAccountEmailHtml,
} from '@/lib/email'

function resolveDomain() {
  const url =
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL)
  try {
    return url ? new URL(url).host : 'localhost:3000'
  } catch {
    return 'localhost:3000'
  }
}

export const auth = betterAuth({
  database: pool,
  // Better Auth's rate limiter is disabled in development by default and
  // uses in-memory storage by default, which doesn't work across separate
  // serverless invocations — "database" persists it in the existing
  // Postgres instance instead, so it actually holds up on Vercel. The
  // default 60s/100req is generous global cover; the custom rules below
  // tighten the endpoints that matter most for brute-forcing.
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: 'database',
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/sign-up/email': { window: 60, max: 5 },
      '/siwe/verify': { window: 60, max: 5 },
      '/forget-password': { window: 60, max: 3 },
      '/send-verification-email': { window: 60, max: 3 },
    },
  },
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    // A user can create an account but can't sign in (403) until they've
    // clicked the verification link. Doesn't affect SIWE wallet sign-in —
    // this block only governs the email/password provider.
    requireEmailVerification: true,
    // Invalidate existing sessions on a successful reset, so a stolen
    // session can't outlive a password change.
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Reset your password — TrustLock',
        html: resetPasswordEmailHtml(url),
      })
    },
    // Fires when someone tries to sign up with an email that already has
    // an account. Because requireEmailVerification is true, Better Auth
    // deliberately returns the SAME generic success response either way
    // (OWASP-style protection against using signup to probe which emails
    // have accounts). What we control is what actually gets emailed: a
    // real sign-up gets a verification link; an existing-account attempt
    // gets pointed at sign-in / password reset instead. The on-screen
    // message stays identical in both cases by design.
    onExistingUserSignUp: async ({ user }) => {
      await sendEmail({
        to: user.email,
        subject: 'Sign-up attempt on your TrustLock account',
        html: existingAccountEmailHtml(),
      })
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email — TrustLock',
        html: verificationEmailHtml(url),
      })
    },
  },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development'
      ? ['http://localhost:3000', `http://localhost:${process.env.PORT ?? 3000}`]
      : []),
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  // Enables authClient.deleteUser() (used by DeleteAccountSection). The
  // in-flight-transaction safety check happens in
  // app/actions/account-deletion.ts BEFORE this ever runs — Better Auth's
  // own deleteUser has no awareness of transactions/escrow state, it just
  // hard-deletes the row (cascading to session/account/walletAddress/
  // payoutAccounts via their FK onDelete rules).
  user: {
    deleteUser: {
      enabled: true,
    },
  },
  plugins: [
    admin({
      defaultRole: 'user',
      adminRoles: ['admin'],
    }),
    siwe({
      domain: resolveDomain(),
      // Wallet-only sign-in is allowed without an email. Payments still
      // need a real email (Paystack requires one for the receipt), which is
      // collected separately at funding time via `payerEmail` on the
      // transaction rather than forced at sign-in.
      anonymous: true,
      getNonce: async () => generateRandomString(32, 'a-z', 'A-Z', '0-9'),
      verifyMessage: async ({ message, signature, address }) => {
        try {
          return await verifyMessage({
            address: address as `0x${string}`,
            message,
            signature: signature as `0x${string}`,
          })
        } catch (error) {
          console.error('SIWE verification failed:', error)
          return false
        }
      },
    }),
  ],
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          // In dev (v0 preview iframe), force cross-site cookies so the
          // session cookie is stored by the browser.
          defaultCookieAttributes: {
            sameSite: 'none' as const,
            secure: true,
          },
        },
      }
    : {}),
})
