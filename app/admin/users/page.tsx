import { db } from '@/lib/db'
import { user } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { UserRoleTable } from '@/components/admin/user-role-table'

export default async function AdminUsersPage() {
  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Users
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {users.length} account{users.length === 1 ? '' : 's'}. Grant admin
          carefully — admins can force-resolve disputes and issue refunds.
        </p>
      </div>
      <UserRoleTable users={users} />
    </div>
  )
}
