'use client'

import { upload } from '@vercel/blob/client'

/**
 * Uploads an image file straight from the browser to Vercel Blob, using a
 * short-lived token from /api/blob/upload (see that route for the auth +
 * validation it applies). Returns the public URL to store.
 *
 * `folder` scopes where in the store this lands ('avatars' or 'products')
 * and `ownerId` keeps one user's uploads from colliding with another's —
 * both are re-validated server-side, so this isn't a trust boundary on its
 * own, just organization.
 */
export async function uploadImage(
  file: File,
  folder: 'avatars' | 'products',
  ownerId: string,
): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
  const pathname = `${folder}/${ownerId}/${Date.now()}-${safeName}`

  const blob = await upload(pathname, file, {
    access: 'public',
    handleUploadUrl: '/api/blob/upload',
  })

  return blob.url
}

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file: File): string | null {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return 'Please choose a JPEG, PNG, WebP, or GIF image.'
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Image must be smaller than 5MB.'
  }
  return null
}
