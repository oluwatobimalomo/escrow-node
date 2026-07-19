'use client'

import { createAuthClient } from 'better-auth/react'
import { siweClient, adminClient } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [siweClient(), adminClient()],
})

export const { signIn, signUp, signOut, useSession } = authClient
