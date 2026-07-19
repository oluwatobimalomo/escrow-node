'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Row = {
  id: string
  name: string
  email: string
  role: string | null
  emailVerified: boolean
  createdAt: Date
}

export function UserRoleTable({ users }: { users: Row[] }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const toggleRole = async (row: Row) => {
    const nextRole = row.role === 'admin' ? 'user' : 'admin'
    if (
      nextRole === 'user' &&
      !window.confirm(`Remove admin access from ${row.name}?`)
    ) {
      return
    }
    setError(null)
    setPendingId(row.id)
    const { error } = await authClient.admin.setRole({
      userId: row.id,
      role: nextRole,
    })
    setPendingId(null)
    if (error) {
      setError(error.message ?? 'Could not update role')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Verified</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-4 py-3 text-foreground">{row.name}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.email}
                </td>
                <td className="px-4 py-3">
                  {row.role === 'admin' ? (
                    <Badge>Admin</Badge>
                  ) : (
                    <span className="text-muted-foreground">User</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.emailVerified ? 'Yes' : 'No'}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pendingId === row.id}
                    onClick={() => toggleRole(row)}
                  >
                    {pendingId === row.id
                      ? 'Updating...'
                      : row.role === 'admin'
                        ? 'Remove admin'
                        : 'Make admin'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
