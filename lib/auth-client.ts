'use client'

import { createAuthClient } from 'better-auth/react'
import { siweClient, adminClient, twoFactorClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [
    siweClient(),
    adminClient(),
    twoFactorClient({
      onTwoFactorRedirect() {
        window.location.href = '/two-factor'
      },
    }),
  ],
})

export const { signIn, signUp, signOut, useSession } = authClient
