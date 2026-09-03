'use client'

import { useMemo, useState } from 'react'
import { ListingCard } from '@/components/dashboard/listing-card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { LISTING_CATEGORIES } from '@/lib/listing-categories'
import { cn } from '@/lib/utils'
import type { ProductListing } from '@/lib/db/schema'

type ListingWithRating = ProductListing & {
  sellerRating?: { avg: number | null; count: number }
  sellerName?: string | null
  sellerVerified?: boolean
}

export function MarketplaceBrowser({ listings }: { listings: ListingWithRating[] }) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')

  const availableCategories = useMemo(() => {
    const present = new Set(listings.map((l) => l.category ?? 'other'))
    return LISTING_CATEGORIES.filter((c) => present.has(c.value))
  }, [listings])

  const trimmed = query.trim().toLowerCase()
  const filtered = listings.filter((l) => {
    const matchesQuery = !trimmed || l.title.toLowerCase().includes(trimmed)
    const matchesCategory = category === 'all' || (l.category ?? 'other') === category
    return matchesQuery && matchesCategory
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search listings..."
          className="pl-9"
          aria-label="Search listings"
        />
      </div>

      {availableCategories.length > 1 && (
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              category === 'all'
                ? 'border-primary bg-accent text-accent-foreground'
                : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            All
          </button>
          {availableCategories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                'rounded-full border px-2.5 py-1 text-xs transition-colors',
                category === c.value
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {trimmed ? `No listings match \u201c${query}\u201d.` : 'No listings in this category.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  )
}
