'use client'

import { useEffect, useState } from 'react'
import {
  getBankList,
  verifyBankAccount,
  savePayoutAccount,
} from '@/app/actions/payout-accounts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type Bank = { name: string; code: string }
type Existing = {
  bankName: string
  accountNumber: string
  accountName: string
} | null

export function PayoutAccountForm({ existing }: { existing: Existing }) {
  const [banks, setBanks] = useState<Bank[]>([])
  const [banksLoading, setBanksLoading] = useState(true)
  const [bankCode, setBankCode] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [resolvedName, setResolvedName] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [replacing, setReplacing] = useState(false)

  useEffect(() => {
    getBankList()
      .then(setBanks)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Could not load bank list'),
      )
      .finally(() => setBanksLoading(false))
  }, [])

  const handleVerify = async () => {
    setError(null)
    setResolvedName(null)
    setVerifying(true)
    try {
      const result = await verifyBankAccount(accountNumber, bankCode)
      setResolvedName(result.accountName)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not verify account')
    } finally {
      setVerifying(false)
    }
  }

  const handleSave = async () => {
    setError(null)
    setSaving(true)
    try {
      const bankName = banks.find((b) => b.code === bankCode)?.name ?? ''
      await savePayoutAccount(accountNumber, bankCode, bankName)
      setSaved(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save payout account')
    } finally {
      setSaving(false)
    }
  }

  if (existing && !replacing && !saved) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-md border border-border p-3 text-sm">
          <p className="text-foreground font-medium">{existing.accountName}</p>
          <p className="text-muted-foreground">
            {existing.bankName} · ****{existing.accountNumber.slice(-4)}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => setReplacing(true)}
        >
          Replace bank account
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="bank">Bank</Label>
        <Select value={bankCode} onValueChange={(v) => setBankCode(v ?? '')} disabled={banksLoading}>
          <SelectTrigger id="bank">
            <SelectValue placeholder={banksLoading ? 'Loading banks...' : 'Select your bank'} />
          </SelectTrigger>
          <SelectContent>
            {banks.map((b) => (
              <SelectItem key={b.code} value={b.code}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="account-number">Account number</Label>
        <Input
          id="account-number"
          value={accountNumber}
          onChange={(e) => {
            setAccountNumber(e.target.value)
            setResolvedName(null)
          }}
          maxLength={10}
          placeholder="10-digit account number"
        />
      </div>

      {!resolvedName ? (
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={verifying || !bankCode || accountNumber.length !== 10}
          onClick={handleVerify}
        >
          {verifying ? 'Verifying...' : 'Verify account'}
        </Button>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            Confirm this is you: <strong>{resolvedName}</strong>
          </div>
          <Button
            type="button"
            className="w-fit"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Saving...' : 'Save payout account'}
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-emerald-600">
          Payout account saved. Reload to see it reflected above.
        </p>
      )}
    </div>
  )
}
