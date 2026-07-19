'use client'

import { createWalletClient, custom, type Address } from 'viem'
import { mainnet } from 'viem/chains'

// Minimal EIP-1193 provider surface — enough to connect and sign without
// pulling in a full wallet-connector stack (wagmi/RainbowKit/WalletConnect),
// which needs an external project ID we don't have here. Any injected
// wallet (MetaMask, Rabby, Coinbase Wallet extension, etc.) exposes this on
// window.ethereum.
type Eip1193Provider = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

export class NoWalletError extends Error {
  constructor() {
    super(
      'No wallet extension found. Install MetaMask or another Ethereum wallet to continue.',
    )
    this.name = 'NoWalletError'
  }
}

export function getInjectedProvider(): Eip1193Provider {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new NoWalletError()
  }
  return window.ethereum
}

/** Prompts the wallet's account picker and returns the chosen address + chain. */
export async function connectWallet(): Promise<{
  address: Address
  chainId: number
}> {
  const provider = getInjectedProvider()
  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
  })) as string[]
  if (!accounts?.[0]) throw new Error('Wallet connection was rejected')

  const chainIdHex = (await provider.request({
    method: 'eth_chainId',
  })) as string

  return {
    address: accounts[0] as Address,
    chainId: Number.parseInt(chainIdHex, 16),
  }
}

/** Builds and requests a signature for an ERC-4361 (SIWE) message. */
export async function signSiweMessage(args: {
  address: Address
  chainId: number
  nonce: string
  statement?: string
}): Promise<{ message: string; signature: `0x${string}` }> {
  const provider = getInjectedProvider()
  const client = createWalletClient({
    account: args.address,
    chain: { ...mainnet, id: args.chainId },
    transport: custom(provider),
  })

  const domain = window.location.host
  const uri = window.location.origin
  const issuedAt = new Date().toISOString()
  const statement =
    args.statement ?? 'Sign in to TrustLock with your Ethereum wallet.'

  const message = [
    `${domain} wants you to sign in with your Ethereum account:`,
    args.address,
    '',
    statement,
    '',
    `URI: ${uri}`,
    'Version: 1',
    `Chain ID: ${args.chainId}`,
    `Nonce: ${args.nonce}`,
    `Issued At: ${issuedAt}`,
  ].join('\n')

  const signature = await client.signMessage({
    account: args.address,
    message,
  })

  return { message, signature }
}
