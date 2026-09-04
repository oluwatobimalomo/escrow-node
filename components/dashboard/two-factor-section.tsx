'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ShieldCheck, ShieldOff } from 'lucide-react'

type Step = 'status' | 'enable-password' | 'enable-verify' | 'disable-password'

export function TwoFactorSection({
  enabled,
  hasPassword,
}: {
  enabled: boolean
  hasPassword: boolean
}) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('status')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [totpURI, setTotpURI] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const qrImageUrl = totpURI
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpURI)}`
    : ''

  const handleStartEnable = () => {
    setError(null)
    setPassword('')
    setStep('enable-password')
  }

  const handleSubmitPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data, error } = await authClient.twoFactor.enable({
      password,
    })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'Could not start two-factor setup')
      return
    }
    if (data && 'totpURI' in data) {
      setTotpURI(data.totpURI)
      setBackupCodes(data.backupCodes ?? [])
      setStep('enable-verify')
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.twoFactor.verifyTotp({ code })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'Invalid code -- check your authenticator app and try again')
      return
    }
    setStep('status')
    setPassword('')
    setCode('')
    router.refresh()
  }

  const handleStartDisable = () => {
    setError(null)
    setPassword('')
    setStep('disable-password')
  }

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.twoFactor.disable({ password })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'Could not disable two-factor authentication')
      return
    }
    setStep('status')
    setPassword('')
    router.refresh()
  }

  if (!hasPassword) {
    return (
      <p className="text-sm text-muted-foreground">
        Two-factor authentication is only available for accounts with a password. You
        signed in with a wallet.
      </p>
    )
  }

  if (step === 'enable-password') {
    return (
      <form onSubmit={handleSubmitPassword} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Enter your password to start setting up an authenticator app.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="2fa-password">Password</Label>
          <Input
            id="2fa-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'Continuing...' : 'Continue'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setStep('status')}>
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  if (step === 'enable-verify') {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Scan this QR code with an authenticator app (Google Authenticator, Authy,
          1Password, etc.), or enter the code manually.
        </p>
        {qrImageUrl && (
          <img
            src={qrImageUrl}
            alt="Two-factor authentication QR code"
            className="size-40 rounded-lg border border-border bg-white p-2"
          />
        )}
        <p className="break-all rounded-md border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          {totpURI}
        </p>
        {backupCodes.length > 0 && (
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-medium text-foreground">Backup codes</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Save these somewhere safe. Each can be used once if you lose access to
              your authenticator app.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-xs text-foreground">
              {backupCodes.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={handleVerifyCode} className="flex flex-col gap-2">
          <Label htmlFor="2fa-code">Enter the 6-digit code to confirm</Label>
          <Input
            id="2fa-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            required
          />
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? 'Verifying...' : 'Verify and enable'}
          </Button>
        </form>
      </div>
    )
  }

  if (step === 'disable-password') {
    return (
      <form onSubmit={handleDisable} className="flex flex-col gap-4">
        <p className="text-sm text-muted-foreground">
          Enter your password to turn off two-factor authentication.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="2fa-disable-password">Password</Label>
          <Input
            id="2fa-disable-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <Button type="submit" variant="destructive" disabled={loading}>
            {loading ? 'Disabling...' : 'Disable two-factor authentication'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setStep('status')}>
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        {enabled ? (
          <ShieldCheck className="size-5 text-emerald-600" aria-hidden="true" />
        ) : (
          <ShieldOff className="size-5 text-muted-foreground" aria-hidden="true" />
        )}
        <p className="text-sm text-foreground">
          {enabled
            ? 'Two-factor authentication is enabled.'
            : 'Two-factor authentication is not enabled.'}
        </p>
      </div>
      {enabled ? (
        <Button variant="outline" onClick={handleStartDisable}>
          Disable
        </Button>
      ) : (
        <Button onClick={handleStartEnable}>Enable</Button>
      )}
    </div>
  )
}
