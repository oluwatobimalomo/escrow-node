// --- ADD THIS FUNCTION to your existing app/actions/admin.ts ---
// (alongside the other admin actions — add the import for `transactions`
// if not already imported, and `or`/`notInArray` from drizzle-orm)

const TERMINAL_STATUSES = ['completed', 'cancelled', 'refunded']

/**
 * Same safety check as self-service account deletion (see
 * app/actions/account-deletion.ts), but for an admin deleting someone
 * else's account. removeUser() from Better Auth's admin plugin is a hard
 * delete with no awareness of in-flight transactions — this check runs
 * first so an admin can't accidentally delete a user who's still a party
 * to escrowed funds.
 */
export async function adminCheckCanDeleteUser(targetUserId: string) {
  const admin = await requireAdmin() // already defined earlier in this file

  if (targetUserId === admin.id) {
    return { canDelete: false, reason: 'You cannot delete your own account from here.' }
  }

  const active = await db
    .select({ id: transactions.id, code: transactions.code })
    .from(transactions)
    .where(
      and(
        or(eq(transactions.buyerId, targetUserId), eq(transactions.sellerId, targetUserId)),
        notInArray(transactions.status, TERMINAL_STATUSES),
      ),
    )

  if (active.length > 0) {
    return {
      canDelete: false,
      reason: `This user has ${active.length} active transaction${active.length === 1 ? '' : 's'} (e.g. ${active[0].code}) that must be resolved first.`,
    }
  }

  return { canDelete: true, reason: null }
}
