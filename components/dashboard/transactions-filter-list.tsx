'use client'

import { useState } from 'react'
import {
  TransactionEmptyState,
  TransactionListItem,
} from '@/components/dashboard/transaction-list'
import { cn } from '@/lib/utils'
import type { Transaction } from '@/lib/db/schema'

type Filter = 'all' | 'buying' | 'selling' | 'active'

const ACTIVE_STATUSES = ['accepted', 'funded', 'shipped', 'disputed']

export function TransactionsFilterList({
  txs,
  myUserId,
}: {
  txs: Transaction[]
  myUserId: string
}) {
  const [filter, setFilter] = useState<Filter>('all')

  const buyingCount = txs.filter((t) => t.buyerId === myUserId).length
  const sellingCount = txs.filter((t) => t.sellerId === myUserId).length
  const activeCount = txs.filter((t) => ACTIVE_STATUSES.includes(t.status)).length

  const filtered = txs.filter((t) => {
    if (filter === 'buying') return t.buyerId === myUserId
    if (filter === 'selling') return t.sellerId === myUserId
    if (filter === 'active') return ACTIVE_STATUSES.includes(t.status)
    return true
  })

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: 'all', label: 'All transactions', count: txs.length },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'buying', label: 'Buying', count: buyingCount },
    { id: 'selling', label: 'Selling', count: sellingCount },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-1 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={cn(
              'border-b-2 px-3 py-2 text-sm font-medium transition-colors',
              filter === tab.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({tab.count})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <TransactionEmptyState />
      ) : (
        <ul className="flex flex-col gap-3">
          {filtered.map((tx) => (
            <TransactionListItem key={tx.id} tx={tx} myUserId={myUserId} />
          ))}
        </ul>
      )}
    </div>
  )
}
