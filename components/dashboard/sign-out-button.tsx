'use client'

import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await authClient.signOut()
        // A hard navigation, not router.push/refresh — this guarantees a
        // fresh round trip to the server with the now-cleared session
        // cookie. The client-side router transition can occasionally
        // repaint before the sign-out cookie fully registers, leaving the
        // landing page's session check briefly stale.
        window.location.href = '/'
      }}
    >
      <LogOut className="size-4" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Sign out</span>
    </Button>
  )
}