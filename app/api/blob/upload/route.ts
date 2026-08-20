import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { NextResponse } from 'next/server'

// Handles two things via @vercel/blob's client-upload flow:
// 1. Issues a short-lived upload token to the browser (onBeforeGenerateToken)
//    — gated on having an active session, since anyone could otherwise use
//    this route to upload arbitrary files to our Blob store for free.
// 2. Receives a webhook-style callback once the upload finishes
//    (onUploadCompleted) — not used for anything beyond logging today,
//    since the actual DB write (attaching the URL to a profile or
//    transaction) happens in the server action that requested the upload,
//    not here.
export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // `pathname` is client-supplied (see lib/blob-client.ts callers) —
        // validate it matches an expected prefix rather than trusting it
        // blindly, so this token can't be used to write anywhere in the
        // store.
        if (!/^(avatars|products)\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(pathname)) {
          throw new Error('Invalid upload path')
        }
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
          addRandomSuffix: true,
        }
      },
      onUploadCompleted: async () => {
        // No-op — see note above.
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Blob upload token request failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 400 },
    )
  }
}
