'use client'

import { useState } from 'react'
import { getMyDataExport } from '@/app/actions/data-export'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export function DataPrivacySection() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getMyDataExport()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `trustlock-my-data-${Date.now()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not prepare your data export')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">
        Download everything TrustLock holds about your account — your profile,
        linked wallets, transaction history, reviews, and listings — in a plain
        JSON file you can keep or inspect yourself. We never store your raw BVN,
        only whether it was verified.
      </p>
      <Button onClick={handleDownload} disabled={loading} variant="outline" className="w-fit">
        <Download className="size-4" aria-hidden="true" />
        {loading ? 'Preparing...' : 'Download my data'}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
