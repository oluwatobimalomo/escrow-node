'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from '@/lib/auth-client'
import { updateProfile } from '@/app/actions/profile'
import { uploadImage, validateImageFile } from '@/lib/blob-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera } from 'lucide-react'

export function ProfileForm({
  initialName,
  initialBio,
  initialImage,
}: {
  initialName: string
  initialBio: string | null
  initialImage: string | null
}) {
  const router = useRouter()
  const { data: session } = useSession()
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio ?? '')
  const [image, setImage] = useState(initialImage ?? '')
  const [imagePreview, setImagePreview] = useState<string | null>(initialImage)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleFileSelect = (file: File | null) => {
    setError(null)
    setSaved(false)
    if (!file) return
    const problem = validateImageFile(file)
    if (problem) {
      setError(problem)
      return
    }
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (!image && !imageFile) {
      setError('A profile photo is required.')
      return
    }

    setSaving(true)
    try {
      let finalImage = image
      if (imageFile && session?.user?.id) {
        setUploadingImage(true)
        finalImage = await uploadImage(imageFile, 'avatars', session.user.id)
        setUploadingImage(false)
        setImage(finalImage)
        setImageFile(null)
      }
      await updateProfile({ name, bio, image: finalImage })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setUploadingImage(false)
      setError(err instanceof Error ? err.message : 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>
          Profile photo <span className="text-destructive">*</span>
        </Label>
        <div className="flex items-center gap-4">
          <label htmlFor="profile-image-input" className="group relative cursor-pointer">
            <Avatar size="lg">
              {imagePreview && <AvatarImage src={imagePreview} alt={name} />}
              <AvatarFallback>{name.slice(0, 2).toUpperCase() || '?'}</AvatarFallback>
            </Avatar>
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <Camera className="size-5 text-white" aria-hidden="true" />
            </span>
          </label>
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<label htmlFor="profile-image-input" className="cursor-pointer" />}
            >
              {imagePreview ? 'Change photo' : 'Upload photo'}
            </Button>
            <p className="mt-1 text-xs text-muted-foreground">
              JPEG, PNG, WebP, or GIF, up to 5MB. Required.
            </p>
          </div>
        </div>
        <input
          id="profile-image-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={(e) => handleFileSelect(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-name">Full name</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={100}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="profile-bio">
          Bio <span className="text-muted-foreground">(optional, shown on your public profile)</span>
        </Label>
        <Textarea
          id="profile-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="A line or two about what you trade and how you work."
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {saved && !error && (
        <p className="text-sm text-emerald-600">Saved.</p>
      )}

      <Button type="submit" disabled={saving} className="w-fit">
        {uploadingImage ? 'Uploading photo...' : saving ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  )
}
