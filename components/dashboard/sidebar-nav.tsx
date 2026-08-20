'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ArrowLeftRight,
  PackageCheck,
  Wallet,
  UserCircle,
  ShieldAlert,
  Users,
  Store,
  Tag,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: number
}

export function SidebarNav({
  isSeller,
  isAdmin,
  toDispatchCount,
  onNavigate,
}: {
  isSeller: boolean
  isAdmin: boolean
  toDispatchCount: number
  onNavigate?: () => void
}) {
  const pathname = usePathname()

  const mainItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/marketplace', label: 'Marketplace', icon: Store },
    { href: '/dashboard/transactions', label: 'Transactions', icon: ArrowLeftRight },
  ]

  // Sellers get the dispatch queue and listing management; buyers have
  // nothing to ship or sell so these are hidden rather than shown empty.
  if (isSeller) {
    mainItems.push({
      href: '/dashboard/dispatch',
      label: 'Dispatch products',
      icon: PackageCheck,
      badge: toDispatchCount > 0 ? toDispatchCount : undefined,
    })
    mainItems.push({ href: '/dashboard/listings', label: 'My listings', icon: Tag })
  }

  mainItems.push({ href: '/dashboard/payments', label: 'Payments', icon: Wallet })

  const accountItems: NavItem[] = [
    { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
  ]

  if (isAdmin) {
    accountItems.push(
      { href: '/admin/disputes', label: 'Disputes', icon: ShieldAlert },
      { href: '/admin/users', label: 'Users', icon: Users },
    )
  }

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  function renderItem(item: NavItem) {
    const active = isActive(item.href)
    const Icon = item.icon
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          active
            ? 'bg-primary/10 text-primary'
            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        )}
      >
        <Icon className="size-4.5 shrink-0" />
        <span className="flex-1 truncate">{item.label}</span>
        {item.badge !== undefined && (
          <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-primary-foreground">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <nav className="flex h-full flex-col gap-6 p-4" aria-label="Dashboard">
      <div className="flex flex-col gap-1">{mainItems.map(renderItem)}</div>
      <div className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Account
        </p>
        {accountItems.map(renderItem)}
      </div>
    </nav>
  )
}

export function MobileSidebarClose({ onClose }: { onClose: () => void }) {
  return (
    <button
      type="button"
      onClick={onClose}
      className="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
      aria-label="Close menu"
    >
      <X className="size-5" />
    </button>
  )
}
