import { betterAuth } from 'better-auth'
import { siwe, admin } from 'better-auth/plugins'
import { generateRandomString } from 'better-auth/crypto'
import { verifyMessage } from 'viem'
import { pool } from '@/lib/db'
import { sendEmail, verificationEmailHtml } from '@/lib/email'

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
