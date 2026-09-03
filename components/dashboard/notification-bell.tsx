'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell } from 'lucide-react'
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/app/actions/notifications'
import type { Notification } from '@/lib/db/schema'

function timeAgo(date: Date | string) {
  const d = new Date(date)
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

/**
 * Self-contained: fetches its own data via server actions rather than
 * needing notifications threaded down as a prop through layout ->
 * DashboardShell, so it can be dropped into the header with zero
 * plumbing. Polls every 60s so the unread badge updates during a long
 * session without needing a websocket for what's a low-frequency signal.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getMyNotifications()
      setNotifications(rows)
    } catch {
      // Best-effort — a failed fetch just leaves the bell showing stale data.
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, 60_000)
    return () => clearInterval(interval)
  }, [load])

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleToggle = () => {
    const opening = !open
    setOpen(opening)
    if (opening) load()
  }

  const handleItemClick = (n: Notification) => {
    setOpen(false)
    if (!n.read) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)))
      markNotificationRead(n.id).catch(() => {})
    }
  }

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    markAllNotificationsRead().catch(() => {})
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative flex size-9 items-center justify-center rounded-md text-foreground hover:bg-accent"
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1.5 right-1.5 flex size-2 rounded-full bg-destructive"
            aria-hidden="true"
          />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-lg border border-border bg-popover shadow-lg">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-medium text-foreground">Notifications</p>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                  {loading ? 'Loading...' : 'No notifications yet'}
                </p>
              ) : (
                <ul className="flex flex-col">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={n.link ?? '/dashboard'}
                        onClick={() => handleItemClick(n)}
                        className={`flex flex-col gap-0.5 border-b border-border px-4 py-3 text-sm transition-colors last:border-b-0 hover:bg-accent ${
                          n.read ? '' : 'bg-accent/40'
                        }`}
                      >
                        <span className="flex items-start gap-2">
                          {!n.read && (
                            <span
                              className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={n.read ? 'text-muted-foreground' : 'font-medium text-foreground'}
                          >
                            {n.title}
                          </span>
                        </span>
                        <span className="pl-3.5 text-xs text-muted-foreground">
                          {timeAgo(n.createdAt)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
