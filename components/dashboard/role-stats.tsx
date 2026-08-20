'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { formatNaira } from '@/lib/escrow'
import { cn } from '@/lib/utils'
import { Star } from 'lucide-react'

type BuyerStats = {
  total: number
  active: number
  awaitingConfirmation: number
  disputed: number
  totalSpent: number
  inEscrow: number
}

type SellerStats = {
  total: number
  active: number
  toDispatch: number
  disputed: number
  pendingPayments: number
  totalEarnings: number
  availablePaid: number
  availableUnpaid: number
  payoutsCompleted: number
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string
  value: string
  sub?: string
  icon?: React.ReactNode
}) {
  return (
    <Card className="gap-2 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        {icon}
      </div>
      <p className="font-mono text-2xl font-semibold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </Card>
  )
}

export function RoleStats({
  buyer,
  seller,
  rating,
}: {
  buyer: BuyerStats
  seller: SellerStats
  rating: number | null
}) {
  const isBuyer = buyer.total > 0
  const isSeller = seller.total > 0
  const [role, setRole] = useState<'buyer' | 'seller'>(
    isSeller && seller.active >= buyer.active ? 'seller' : 'buyer',
  )

  const showToggle = isBuyer && isSeller

  return (
    <div className="flex flex-col gap-4">
      {showToggle && (
        <div className="flex w-fit rounded-lg border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => setRole('buyer')}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              role === 'buyer'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Buying
          </button>
          <button
            type="button"
            onClick={() => setRole('seller')}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
              role === 'seller'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Selling
          </button>
        </div>
      )}

      {(!showToggle ? isSeller : role === 'seller') ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My transactions" value={String(seller.total)} />
          <StatCard label="Active" value={String(seller.active)} />
          <StatCard label="Pending payments" value={String(seller.pendingPayments)} />
          <StatCard
            label="Total earnings"
            value={formatNaira(seller.totalEarnings)}
            sub="Completed payouts"
          />
          <StatCard label="Available (paid)" value={formatNaira(seller.availablePaid)} />
          <StatCard label="Available (unpaid)" value={formatNaira(seller.availableUnpaid)} />
          <StatCard label="To dispatch" value={String(seller.toDispatch)} />
          <StatCard label="Payouts completed" value={String(seller.payoutsCompleted)} />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="My transactions" value={String(buyer.total)} />
          <StatCard label="Active" value={String(buyer.active)} />
          <StatCard
            label="Awaiting your confirmation"
            value={String(buyer.awaitingConfirmation)}
          />
          <StatCard label="Held in escrow" value={formatNaira(buyer.inEscrow)} />
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {role === 'buyer' && (
          <StatCard label="Total spent" value={formatNaira(buyer.totalSpent)} />
        )}
        <StatCard
          label="Rating"
          value={rating ? rating.toFixed(1) : '—'}
          icon={rating ? <Star className="size-4 fill-warning text-warning" /> : undefined}
        />
      </div>
    </div>
  )
}
