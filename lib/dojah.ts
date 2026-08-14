// Dojah identity verification client. Auth uses two headers (confirmed
// from Dojah's own docs): `Authorization: <secret key>` (no "Bearer"
// prefix) and `AppId: <app id>`. Both come from your Dojah dashboard
// (Settings → API Keys) once you've signed up.
//
// *** ONE THING TO CONFIRM ONCE YOU HAVE DASHBOARD ACCESS ***
// Dojah's docs site was mid-restructuring when this was written, so I
// couldn't pin down the exact current path for the BVN lookup endpoint
// with full certainty — everything else here (auth header format,
// response shape, sandbox test value) is confirmed directly from their
// docs. Once you're signed in, your dashboard's API reference shows
// copy-pasteable code with YOUR exact endpoint path filled in — check
// that DOJAH_BVN_PATH below matches what your dashboard shows for
// "BVN Lookup" / "Validate BVN" under Verify Individual → Government
// Data Lookup. If it differs, just update the constant — nothing else
// in this file needs to change.
const DOJAH_BVN_PATH = '/api/v1/kyc/bvn/full'

function baseUrl() {
  // Dojah uses separate sandbox/production hosts. Defaults to sandbox —
  // switch DOJAH_BASE_URL in your environment once you go live.
  return process.env.DOJAH_BASE_URL ?? 'https://sandbox.dojah.io'
}

function headers() {
  const appId = process.env.DOJAH_APP_ID
  const secretKey = process.env.DOJAH_SECRET_KEY
  if (!appId || !secretKey) {
    throw new Error(
      'DOJAH_APP_ID / DOJAH_SECRET_KEY are not set. Add them to your environment to verify identities.',
    )
  }
  return {
    Authorization: secretKey,
    AppId: appId,
    'Content-Type': 'application/json',
  }
}

type DojahBvnResponse = {
  entity: {
    first_name?: string
    last_name?: string
    date_of_birth?: string // "YYYY-MM-DD"
    bvn?: string
    phone_number1?: string
  }
}

/**
 * Looks up a BVN against Dojah's government-data lookup. Returns the
 * name/DOB on file so the caller can compare against what the user
 * entered — same pattern as the earlier Paystack-based version, just
 * against a provider that actually supports this for non-bank platforms.
 */
export async function lookupBvn(bvn: string): Promise<DojahBvnResponse['entity']> {
  const url = `${baseUrl()}${DOJAH_BVN_PATH}?bvn=${encodeURIComponent(bvn)}`
  const res = await fetch(url, { headers: headers() })
  const json = (await res.json()) as DojahBvnResponse & { error?: string }

  if (!res.ok) {
    throw new Error(
      json.error || 'Could not verify that BVN — double check it and try again',
    )
  }
  return json.entity
}
