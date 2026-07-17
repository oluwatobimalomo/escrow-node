import Link from 'next/link'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function SiteHeader({ isAuthed }: { isAuthed: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-4.5" aria-hidden="true" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            TrustLock
          </span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
          <a
            href="#how-it-works"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            How it works
          </a>
          <a
            href="#features"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Features
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {isAuthed ? (
            <Button render={<Link href="/dashboard" />} size="sm">
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button
                render={<Link href="/sign-in" />}
                variant="ghost"
                size="sm"
              >
                Sign in
              </Button>
              <Button render={<Link href="/sign-up" />} size="sm">
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
