// Dojah identity verification client.
//
// Confirmed directly against the live sandbox API (not assumed): this
// endpoint does NOT return the registered name as a plain string to look
// up. Instead, you submit the name you're claiming (first_name/last_name)
// alongside the BVN, and Dojah tells you per-field whether it matches,
// with a confidence score — it never hands back a stranger's real name,
// which is a better privacy design than earlier versions of this file
// assumed. Confirmed response shape:
//
//   { "entity": {
//       "bvn": "...",
//       "first_name": { "status": true, "confidence_value": 100 },
//       "last_name":  { "status": true, "confidence_value": 100 },
//       "date_of_birth": { "status": true },
//       "phone_number": { "status": true }
//   } }
//
// Note: in Dojah's SANDBOX environment, the fixed test BVN (22222222222)
// returns status:true/confidence_value:100 regardless of what name is
// submitted — this was verified directly (submitting "Wrong"/"Name" still
// returned a full match). That's expected canned-sandbox behavior, not a
// bug — real discrimination between a correct and incorrect name can only
// be confirmed once this is running against live keys.
const DOJAH_BVN_PATH = '/api/v1/kyc/bvn'

function baseUrl() {
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

type DojahFieldCheck = { status: boolean; confidence_value?: number }

type DojahBvnResponse = {
  entity: {
    bvn: string
    first_name?: DojahFieldCheck
    last_name?: DojahFieldCheck
    date_of_birth?: DojahFieldCheck
    phone_number?: DojahFieldCheck
  }
}

/**
 * Checks a BVN against a claimed first/last name. Returns per-field
 * match status and confidence — the caller decides what threshold counts
 * as "verified" (see app/actions/kyc.ts).
 */
export async function checkBvnNameMatch(args: {
  bvn: string
  firstName: string
  lastName: string
}): Promise<DojahBvnResponse['entity']> {
  const params = new URLSearchParams({
    bvn: args.bvn,
    first_name: args.firstName,
    last_name: args.lastName,
  })
  const url = `${baseUrl()}${DOJAH_BVN_PATH}?${params.toString()}`
  const res = await fetch(url, { headers: headers() })
  const json = (await res.json()) as DojahBvnResponse & { error?: string }

  if (!res.ok || !json.entity) {
    throw new Error(
      json.error || 'Could not verify that BVN — double check it and try again',
    )
  }
  return json.entity
}
