'use client'

import { useState } from 'react'
import { verifyBvnIdentity } from '@/app/actions/kyc'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BadgeCheck } from 'lucide-react'

export function BvnVerificationForm({
  verified,
  verifiedName,
  verifiedAt,
}: {
  verified: boolean
  verifiedName: string | null
  verifiedAt: Date | null
}) {
  const [bvn, setBvn] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [justVerified, setJustVerified] = useState<string | null>(null)

  if (verified || justVerified) {
    return (
      <div className="flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
        <BadgeCheck className="size-4 shrink-0" aria-hidden="true" />
        <span>
          Identity verified as <strong>{justVerified ?? verifiedName}</strong>
          {verifiedAt && !justVerified && (
            <>
              {' '}
              on{' '}
              {new Date(verifiedAt).toLocaleDateString('en-NG', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </>
          )}
          .
        </span>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setVerifying(true)
    try {
      const result = await verifyBvnIdentity(bvn)
      setJustVerified(result.verifiedName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed')
    } finally {
      setVerifying(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Optional, but verified accounts are more likely to be trusted by
        counterparties. We check your BVN and confirm the registered name
        matches your account — we never store the BVN itself.
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bvn">Bank Verification Number (BVN)</Label>
        <Input
          id="bvn"
          value={bvn}
          onChange={(e) => setBvn(e.target.value)}
          maxLength={11}
          inputMode="numeric"
          placeholder="11-digit BVN"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button
        type="submit"
        className="w-fit"
        disabled={verifying || bvn.length !== 11}
      >
        {verifying ? 'Verifying...' : 'Verify identity'}
      </Button>
    </form>
  )
}
