'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function TwoFactorVerifyForm() {
  const router = useRouter()
  const [code, setCode] = useState('')
  const [useBackup, setUseBackup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = useBackup
      ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice: true })
      : await authClient.twoFactor.verifyTotp({ code, trustDevice: true })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'Invalid code')
      return
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="verify-code">
          {useBackup ? 'Backup code' : 'Authentication code'}
        </Label>
        <Input
          id="verify-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          inputMode={useBackup ? 'text' : 'numeric'}
          maxLength={useBackup ? 20 : 6}
          placeholder={useBackup ? 'xxxxx-xxxxx' : '000000'}
          required
          autoFocus
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Verifying...' : 'Verify'}
      </Button>
      <button
        type="button"
        onClick={() => {
          setUseBackup((v) => !v)
          setCode('')
          setError(null)
        }}
        className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
      >
        {useBackup ? 'Use authenticator code instead' : 'Use a backup code instead'}
      </button>
    </form>
  )
}
