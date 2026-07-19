import { Star, BadgeCheck, Wallet } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'

export function ReputationSummary({
  avgRating,
  reviewCount,
  completedCount,
  emailVerified,
  walletLinked,
  recentReviews,
}: {
  avgRating: number | null
  reviewCount: number
  completedCount: number
  emailVerified: boolean
  walletLinked: boolean
  recentReviews: {
    id: number
    rating: number
    comment: string | null
    createdAt: Date
    reviewerName: string
  }[]
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-3 text-center">
          <p className="flex items-center justify-center gap-1 text-lg font-semibold text-foreground">
            <Star className="size-4 fill-amber-400 text-amber-400" aria-hidden="true" />
            {avgRating != null ? avgRating.toFixed(1) : '—'}
          </p>
          <p className="text-xs text-muted-foreground">
            {reviewCount} review{reviewCount === 1 ? '' : 's'}
          </p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-lg font-semibold text-foreground">{completedCount}</p>
          <p className="text-xs text-muted-foreground">Completed deals</p>
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center gap-1">
          {emailVerified ? (
            <Badge className="gap-1">
              <BadgeCheck className="size-3" aria-hidden="true" /> Email verified
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">Email not verified</span>
          )}
        </Card>
        <Card className="p-3 flex flex-col items-center justify-center gap-1">
          {walletLinked ? (
            <Badge variant="outline" className="gap-1">
              <Wallet className="size-3" aria-hidden="true" /> Wallet linked
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground">No wallet linked</span>
          )}
        </Card>
      </div>

      {recentReviews.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-foreground">Recent reviews</p>
          {recentReviews.map((r) => (
            <Card key={r.id} className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {r.reviewerName}
                </p>
                <p className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                  {r.rating}
                </p>
              </div>
              {r.comment && (
                <p className="mt-1 text-sm text-muted-foreground">{r.comment}</p>
              )}
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(r.createdAt).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
