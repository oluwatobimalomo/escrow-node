'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { submitExitSurveyAndPrepareDeletion } from '@/app/actions/account-deletion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

type Step = 'survey' | 'confirm' | 'deleting'

export function DeleteAccountSection({ hasPassword }: { hasPassword: boolean }) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('survey')
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function reset() {
    setStep('survey')
    setReason('')
    setPassword('')
    setConfirmText('')
    setError(null)
    setLoading(false)
  }

  const handleContinueFromSurvey = () => {
    setError(null)
    setStep('confirm')
  }

  const handleDelete = async () => {
    setError(null)
    setLoading(true)
    try {
      // Runs the safety check again, logs the exit-survey reason, and
      // emails the user their data export — all before the account (and
      // everything that would cascade with it) is actually gone.
      const check = await submitExitSurveyAndPrepareDeletion(reason)
      if (!check.canDelete) {
        setError(check.reason)
        setLoading(false)
        return
      }

      setStep('deleting')
      const { error } = hasPassword
        ? await authClient.deleteUser({ password })
        : await authClient.deleteUser({})

      if (error) {
        setError(
          error.message ??
            'Could not delete account. If you signed in a while ago, try signing out and back in first, then retry.',
        )
        setStep('confirm')
        setLoading(false)
        return
      }

      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setStep('confirm')
      setLoading(false)
    }
  }

  const confirmed = hasPassword
    ? password.length > 0
    : confirmText.trim().toUpperCase() === 'DELETE'

  return (
    <div className="rounded-lg border border-destructive/30 p-5">
      <h2 className="text-lg font-medium text-destructive mb-1">Danger zone</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Deleting your account is permanent and cannot be undone. You can't
        delete your account while you have active (non-completed)
        transactions.
      </p>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) reset()
        }}
      >
        <DialogTrigger render={<Button variant="destructive" />}>
          Delete my account
        </DialogTrigger>
        <DialogContent>
          {step === 'survey' && (
            <>
              <DialogHeader>
                <DialogTitle>Before you go</DialogTitle>
                <DialogDescription>
                  We'd love to know why you're leaving — this is completely
                  optional and won't slow down the deletion.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                <Label htmlFor="exit-reason">Why are you leaving?</Label>
                <Textarea
                  id="exit-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder="Optional — anything you share helps us improve."
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleContinueFromSurvey}>
                  Continue
                </Button>
              </DialogFooter>
            </>
          )}

          {(step === 'confirm' || step === 'deleting') && (
            <>
              <DialogHeader>
                <DialogTitle>Delete your account?</DialogTitle>
                <DialogDescription>
                  This permanently removes your profile, reputation history,
                  and linked wallets/payout details. We'll email you a copy
                  of your data once this completes. This cannot be undone.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-2">
                {hasPassword ? (
                  <>
                    <Label htmlFor="delete-password">Confirm your password</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                      disabled={step === 'deleting'}
                    />
                  </>
                ) : (
                  <>
                    <Label htmlFor="delete-confirm">Type DELETE to confirm</Label>
                    <Input
                      id="delete-confirm"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder="DELETE"
                      disabled={step === 'deleting'}
                    />
                  </>
                )}
              </div>

              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setStep('survey')}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  variant="destructive"
                  disabled={!confirmed || loading}
                  onClick={handleDelete}
                >
                  {step === 'deleting'
                    ? 'Deleting...'
                    : loading
                      ? 'Preparing your data...'
                      : 'Permanently delete account'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
