'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { checkCanDeleteAccount } from '@/app/actions/account-deletion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

export function DeleteAccountSection({ hasPassword }: { hasPassword: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setError(null)
    setLoading(true)
    try {
      const check = await checkCanDeleteAccount()
      if (!check.canDelete) {
        setError(check.reason)
        setLoading(false)
        return
      }

      const { error } = hasPassword
        ? await authClient.deleteUser({ password })
        : await authClient.deleteUser({})

      if (error) {
        setError(
          error.message ??
            'Could not delete account. If you signed in a while ago, try signing out and back in first, then retry.',
        )
        setLoading(false)
        return
      }

      window.location.href = '/'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
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
        delete your account while you have active (non-completed) transactions.
      </p>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger render={<Button variant="destructive" />}>
          Delete my account
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your account?</DialogTitle>
            <DialogDescription>
              This permanently removes your profile, reputation history, and
              linked wallets/payout details. This cannot be undone.
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
                />
              </>
            ) : (
              <>
                <Label htmlFor="delete-confirm">
                  Type DELETE to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
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
              variant="destructive"
              disabled={!confirmed || loading}
              onClick={handleDelete}
            >
              {loading ? 'Deleting...' : 'Permanently delete account'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
