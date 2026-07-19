import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  // Deliberately redirect to the ordinary dashboard rather than a 403 page
  // — non-admins shouldn't learn this section exists at all.
  if (session.user.role !== 'admin') redirect('/dashboard')

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
          <Link href="/admin/disputes" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-amber-500 text-white">
              <ShieldAlert className="size-4.5" aria-hidden="true" />
            </span>
            <span className="text-lg font-semibold tracking-tight text-foreground">
              TrustLock Admin
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/admin/disputes"
              className="text-muted-foreground hover:text-foreground"
            >
              Disputes
            </Link>
            <Link
              href="/admin/users"
              className="text-muted-foreground hover:text-foreground"
            >
              Users
            </Link>
            <Link
              href="/dashboard"
              className="text-muted-foreground hover:text-foreground"
            >
              Back to app
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">{children}</main>
    </div>
  )
}
