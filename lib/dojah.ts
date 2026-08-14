// Dojah identity verification client. Auth uses two headers:
// `Authorization: <secret key>` and `AppId: <app id>`.
const DOJAH_BVN_PATH = '/api/v1/kyc/bvn' // Updated to the official path

function baseUrl(): string {
  return process.env.DOJAH_BASE_URL ?? 'https://sandbox.dojah.io'
}

function headers(): HeadersInit {
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

export type DojahBvnEntity = {
  first_name: string
  last_name: string
  middle_name?: string
  date_of_birth: string
  bvn: string
  phone_number1: string
  phone_number2?: string
  gender?: string
  image?: string
}

type DojahBvnResponse = {
  entity: DojahBvnEntity
}

/**
 * Looks up a BVN against Dojah's government-data lookup. 
 * Returns the name/DOB on file so the caller can compare it.
 */
export async function lookupBvn(bvn: string): Promise<DojahBvnEntity> {
  const url = `${baseUrl()}${DOJAH_BVN_PATH}?bvn=${encodeURIComponent(bvn)}`
  
  const res = await fetch(url, { 
    method: 'GET',
    headers: headers() 
  })

  // Handle systemic failures (500s, 401s, etc.) before parsing JSON safely
  if (!res.ok) {
    let errorMessage = 'Could not verify that BVN — check parameters and try again'
    try {
      const json = await res.json() as { error?: string | { message?: string } }
      if (json.error) {
        errorMessage = typeof json.error === 'string' ? json.error : json.error.message || errorMessage
      }
    } catch {
      // Fallback if response isn't valid JSON
    }
    throw new Error(errorMessage)
  }

  const json = (await res.json()) as DojahBvnResponse
  
  if (!json.entity) {
    throw new Error('Dojah lookup succeeded but no identity entity records were recovered.')
  }

  return json.entity
}
