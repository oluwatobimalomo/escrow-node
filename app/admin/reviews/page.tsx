import { getReviewsForModeration } from '@/app/actions/admin-reviews'
import { Card } from '@/components/ui/card'
import { Star } from 'lucide-react'

function scoreCardStyle(score: number | null) {
  if (score === null) return 'border-border'
  if (score < 40) return 'border-destructive/40 bg-destructive/5'
  if (score < 70) return 'border-warning/40 bg-warning/5'
  return 'border-border'
}

export default async function AdminReviewsPage() {
  const reviewList = await getReviewsForModeration()
  const flaggedCount = reviewList.filter(
    (r) => r.authenticityScore !== null && r.authenticityScore < 40,
  ).length

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Review moderation
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {reviewList.length} review{reviewList.length === 1 ? '' : 's'} with written comments.{' '}
          {flaggedCount > 0 &&
            `${flaggedCount} flagged as possibly low-effort or templated. `}
          Authenticity scores are an AI-assisted signal for your judgement, not a
          determination — nothing here is auto-removed, and this is never shown to users.
        </p>
      </div>

      {reviewList.length === 0 ? (
        <p className="text-sm text-muted-foreground">No written reviews yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {reviewList.map((r) => (
            <Card key={r.id} className={`p-4 ${scoreCardStyle(r.authenticityScore)}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {r.reviewerName} → {r.revieweeName}
                  </p>
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    {r.transactionCode} &middot; {r.transactionTitle}
                  </p>
                </div>
                <span
                  className="flex items-center gap-0.5"
                  aria-label={`${r.rating} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={
                        i < r.rating
                          ? 'size-3.5 fill-warning text-warning'
                          : 'size-3.5 text-muted-foreground/40'
                      }
                      aria-hidden="true"
                    />
                  ))}
                </span>
              </div>
              <p className="mt-3 text-sm text-foreground">{r.comment}</p>
              <div className="mt-3 border-t border-border pt-3 text-xs text-muted-foreground">
                {r.authenticityScore !== null ? (
                  <>
                    Authenticity score:{' '}
                    <span className="font-medium text-foreground">
                      {r.authenticityScore}/100
                    </span>{' '}
                    — {r.authenticityNote}
                  </>
                ) : (
                  'Not scored (comment too short, or check unavailable).'
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
