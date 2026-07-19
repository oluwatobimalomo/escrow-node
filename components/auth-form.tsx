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
import { WalletConnectButton } from '@/components/wallet-connect-button'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [verificationSent, setVerificationSent] = useState(false)
  const [unverified, setUnverified] = useState(false)
  const [resending, setResending] = useState(false)

  const isSignUp = mode === 'sign-up'

  const handleResend = async () => {
    setResending(true)
    setError(null)
    const { error } = await authClient.sendVerificationEmail({
      email,
      callbackURL: '/dashboard',
    })
    setResending(false)
    if (error) {
      setError(error.message ?? 'Could not resend the email')
    } else {
      setVerificationSent(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setUnverified(false)
    setLoading(true)

    const { error } = isSignUp
      ? await authClient.signUp.email({ email, password, name })
      : await authClient.signIn.email({ email, password })

    setLoading(false)

    if (error) {
      if (error.status === 403) {
        // Correct credentials, but the email hasn't been verified yet.
        setUnverified(true)
        return
      }
      setError(error.message ?? 'Something went wrong')
      return
    }

    if (isSignUp) {
      // requireEmailVerification means sign-up doesn't create a session —
      // point the user at their inbox instead of the dashboard.
      setVerificationSent(true)
      return
    }

    router.push('/dashboard')
    router.refresh()
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
          {verificationSent ? (
            <div className="flex flex-col gap-4 text-center">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
                Check your email
              </h1>
              <p className="text-sm text-muted-foreground">
                We sent a verification link to <strong>{email}</strong>.
                Click it to activate your account, then come back and sign
                in.
              </p>
              <Button
                variant="outline"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? 'Sending...' : "Didn't get it? Resend"}
              </Button>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSignUp
                ? 'Start trading safely with escrow protection'
                : 'Sign in to your account to continue'}
            </p>
          </div>

          {unverified && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm text-amber-900">
                Your email isn&apos;t verified yet. Check your inbox for the
                link, or{' '}
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="font-medium underline underline-offset-4 disabled:opacity-60"
                >
                  {resending ? 'sending...' : 'resend it'}
                </button>
                .
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Adaeze Okafor"
                />
              </div>
            )}
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
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                placeholder="At least 8 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading
                ? 'Please wait...'
                : isSignUp
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wide text-muted-foreground">
              Or
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <WalletConnectButton />

          <p className="text-sm text-muted-foreground text-center mt-6">
            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
            <Link
              href={isSignUp ? '/sign-in' : '/sign-up'}
              className="text-foreground font-medium underline-offset-4 hover:underline"
            >
              {isSignUp ? 'Sign in' : 'Sign up'}
            </Link>
          </p>
            </>
          )}
        </Card>
      </div>
    </main>
  )
}