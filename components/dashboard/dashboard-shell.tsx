'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/dashboard/sign-out-button'
import { SidebarNav, MobileSidebarClose } from '@/components/dashboard/sidebar-nav'

export function DashboardShell({
  isSeller,
  isAdmin,
  toDispatchCount,
  children,
}: {
  isSeller: boolean
  isAdmin: boolean
  toDispatchCount: number
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="mr-1 flex size-9 items-center justify-center rounded-md text-foreground hover:bg-accent lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </button>
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ShieldCheck className="size-4.5" aria-hidden="true" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-foreground">
                TrustLock
              </span>
            </Link>
          </div>

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

      <div className="mx-auto flex max-w-7xl">
        {/* Desktop sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100svh-4rem)] w-60 shrink-0 border-r border-border lg:block">
          <SidebarNav isSeller={isSeller} isAdmin={isAdmin} toDispatchCount={toDispatchCount} />
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80vw] flex-col bg-background shadow-xl">
              <div className="flex h-16 items-center justify-between border-b border-border px-4">
                <span className="text-lg font-semibold tracking-tight text-foreground">
                  Menu
                </span>
                <MobileSidebarClose onClose={() => setMobileOpen(false)} />
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarNav
                  isSeller={isSeller}
                  isAdmin={isAdmin}
                  toDispatchCount={toDispatchCount}
                  onNavigate={() => setMobileOpen(false)}
                />
              </div>
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-4 py-8 md:px-6">{children}</main>
      </div>
    </div>
  )
}
