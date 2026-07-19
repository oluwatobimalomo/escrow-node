'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Wallet2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'
import { connectWallet, signSiweMessage, NoWalletError } from '@/lib/wallet'

function truncate(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function WalletConnectButton() {
  const router = useRouter()
  const [status, setStatus] = useState<'idle' | 'connecting' | 'signing'>(
    'idle',
  )
  const [error, setError] = useState<string | null>(null)
  const [address, setAddress] = useState<string | null>(null)

  const handleClick = async () => {
    setError(null)
    try {
      setStatus('connecting')
      const { address, chainId } = await connectWallet()
      setAddress(address)

      const { data: nonceData, error: nonceError } =
        await authClient.siwe.nonce({ walletAddress: address, chainId })
      if (nonceError || !nonceData) {
        throw new Error(nonceError?.message ?? 'Could not get a sign-in nonce')
      }

      setStatus('signing')
      const { message, signature } = await signSiweMessage({
        address,
        chainId,
        nonce: nonceData.nonce,
      })

      const { data, error: verifyError } = await authClient.siwe.verify({
        message,
        signature,
        walletAddress: address,
        chainId,
      })
      if (verifyError || !data) {
        throw new Error(verifyError?.message ?? 'Signature verification failed')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err) {
      if (err instanceof NoWalletError) {
        setError(err.message)
      } else {
        setError(err instanceof Error ? err.message : 'Wallet sign-in failed')
      }
    } finally {
      setStatus('idle')
    }
  }

  const busy = status !== 'idle'

  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={handleClick}
        disabled={busy}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Wallet2 className="size-4" aria-hidden="true" />
        )}
        {status === 'connecting'
          ? 'Connecting wallet...'
          : status === 'signing'
            ? 'Confirm signature in wallet...'
            : address
              ? `Continue as ${truncate(address)}`
              : 'Continue with wallet'}
      </Button>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
