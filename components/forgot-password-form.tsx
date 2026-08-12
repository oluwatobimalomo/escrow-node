'use client'

import { useState } from 'react'
import Link from 'next/link'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { ShieldCheck } from 'lucide-react'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { error } = await authClient.forgetPassword({
      email,
      redirectTo: '/reset-password',
    })
    setLoading(false)
    if (error) {
      setError(error.message ?? 'Something went wrong')
      return
    }
    setSent(true)
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
          {sent ? (
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
                Check your email
              </h1>
              <p className="text-sm text-muted-foreground">
                If an account exists for <strong>{email}</strong>, a
                password reset link has been sent. It expires in 1 hour.
              </p>
              <Link
                href="/sign-in"
                className="text-sm text-foreground underline underline-offset-4"
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
                  Reset your password
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your account email and we'll send you a reset link.
                </p>
              </div>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Sending...' : 'Send reset link'}
                </Button>
              </form>
              <p className="text-sm text-muted-foreground text-center mt-6">
                Remembered it?{' '}
                <Link
                  href="/sign-in"
                  className="text-foreground font-medium underline-offset-4 hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}
