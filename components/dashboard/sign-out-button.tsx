'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  const router = useRouter()

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={async () => {
        await authClient.signOut()
        router.push('/')
        router.refresh()
      }}
    >
      <LogOut className="size-4" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">Sign out</span>
    </Button>
  )
}
