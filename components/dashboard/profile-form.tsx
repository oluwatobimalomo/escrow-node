'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateProfile } from '@/app/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

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
  const [name, setName] = useState(initialName)
  const [bio, setBio] = useState(initialBio ?? '')
  const [image, setImage] = useState(initialImage ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setSaving(true)
    try {
      await updateProfile({ name, bio, image })
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        <Label htmlFor="profile-image">
          Avatar image URL <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="profile-image"
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://..."
        />
        <p className="text-xs text-muted-foreground">
          No file upload yet — paste a link to an image hosted elsewhere.
        </p>
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
        {saving ? 'Saving...' : 'Save changes'}
      </Button>
    </form>
  )
}
