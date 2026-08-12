'use client'

import { Info, BadgeCheck } from 'lucide-react'

// BVN verification is disabled: NIBSS (Nigeria's BVN infrastructure owner)
// suspended third-party/non-bank access to the resolve_bvn endpoint this
// form was built on, industry-wide — not something retrying or a code fix
// resolves. The replacement (Paystack's async "Validate Customer" flow)
// needs live API keys, which this app doesn't have yet. Re-enable this once
// that's built — see app/actions/kyc.ts and lib/paystack.ts for the old
// implementation, kept for reference.
export function BvnVerificationForm({
  verified,
  verifiedName,
  verifiedAt,
}: {
  verified: boolean
  verifiedName: string | null
  verifiedAt: Date | null
}) {
  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
        <span>
          Identity verified as <strong>{verifiedName}</strong>
          {verifiedAt && <> on {new Date(verifiedAt).toLocaleDateString()}</>}.
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-start gap-2 rounded-md border border-border bg-secondary/30 p-3 text-sm text-muted-foreground">
      <Info className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
      <span>
        BVN verification is temporarily unavailable. Nigeria&apos;s BVN
        authority (NIBSS) restricted direct BVN lookups to banks only, so
        we&apos;re moving to Paystack&apos;s newer verification flow —
        it&apos;ll be back soon.
      </span>
    </div>
  )
}