'use client'

import { useState } from 'react'
import { ListingCard } from '@/components/dashboard/listing-card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import type { ProductListing } from '@/lib/db/schema'

type ListingWithRating = ProductListing & {
  sellerRating?: { avg: number | null; count: number }
}

export function MarketplaceBrowser({ listings }: { listings: ListingWithRating[] }) {
  const [query, setQuery] = useState('')
  const trimmed = query.trim().toLowerCase()
  const filtered = trimmed
    ? listings.filter((l) => l.title.toLowerCase().includes(trimmed))
    : listings

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

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No listings match &ldquo;{query}&rdquo;.
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
