'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'

async function getSessionUser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

/** Most recent notifications for the bell dropdown -- capped at 20, newest first. */
export async function getMyNotifications() {
  const me = await getSessionUser()
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, me.id))
    .orderBy(desc(notifications.createdAt))
    .limit(20)
}

export async function markNotificationRead(id: number) {
  const me = await getSessionUser()
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, me.id)))
  revalidatePath('/dashboard')
}

export async function markAllNotificationsRead() {
  const me = await getSessionUser()
  await db
    .update(notifications)
    .set({ read: true })
    .where(and(eq(notifications.userId, me.id), eq(notifications.read, false)))
  revalidatePath('/dashboard')
}
