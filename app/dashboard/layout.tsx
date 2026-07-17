import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/dashboard/sign-out-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <ShieldCheck className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              TrustLock
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button render={<Link href="/dashboard/new" />} size="sm">
              <Plus className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">New transaction</span>
              <span className="sm:hidden">New</span>
            </Button>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">{children}</main>
    </div>
  )
}
