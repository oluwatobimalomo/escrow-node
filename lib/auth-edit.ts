// --- FULL REPLACEMENT for the `emailAndPassword` block in lib/auth.ts ---
// --- PLUS one new top-level `user` block ---
//
// This supersedes any earlier version of this block — apply this once,
// don't layer it on top of a partial edit from before.

// 1. Update your imports at the top of lib/auth.ts to include the two new
//    email functions:
//
//    import { sendEmail, verificationEmailHtml, resetPasswordEmailHtml, existingAccountEmailHtml } from '@/lib/email'

// 2. Replace your existing `emailAndPassword` block with this:

  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    requireEmailVerification: true,
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
    // (this is intentional — OWASP-style protection against an attacker
    // using signup as a way to probe which emails have accounts on this
    // platform). What we control is what actually gets emailed: a real
    // sign-up gets a verification link; an existing-account attempt gets
    // pointed at sign-in / password reset instead. The on-screen message
    // stays identical in both cases by design — see the note in the
    // integration guide if you want to change that tradeoff.
    onExistingUserSignUp: async ({ user }) => {
      await sendEmail({
        to: user.email,
        subject: 'Sign-up attempt on your TrustLock account',
        html: existingAccountEmailHtml(),
      })
    },
  },

// 3. Add this as a new top-level block, alongside emailAndPassword and
//    emailVerification (not nested inside either):

  user: {
    deleteUser: {
      enabled: true,
    },
  },
