'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

export function ResetPasswordForm({ token }: { token: string | null }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (!token) {
      setError('This reset link is invalid or missing its token.')
      return
    }
    setLoading(true)
    const { error } = await authClient.resetPassword({
      newPassword: password,
      token,
    })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'Could not reset password — the link may have expired')
      return
    }
    setDone(true)
    setTimeout(() => router.push('/sign-in'), 2000)
  }

  return (
    <main className="min-h-svh bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm flex flex-col gap-6">
        <Link href="/" className="flex items-center justify-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <span className="text-xl font-semibold tracking-tight text-foreground">
            TrustLock
          </span>
        </Link>

        <Card className="p-6">
          {!token ? (
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Invalid link
              </h1>
              <p className="text-sm text-muted-foreground">
                This password reset link is missing or invalid. Request a
                new one below.
              </p>
              <Link
                href="/forgot-password"
                className="text-sm text-foreground underline underline-offset-4"
              >
                Request a new link
              </Link>
            </div>
          ) : done ? (
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                Password updated
              </h1>
              <p className="text-sm text-muted-foreground">
                Redirecting you to sign in...
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                  Choose a new password
                </h1>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="At least 8 characters"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Updating...' : 'Update password'}
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
