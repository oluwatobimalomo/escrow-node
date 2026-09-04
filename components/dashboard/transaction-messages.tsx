'use client'

import { useEffect, useRef, useState } from 'react'
import { getTransactionMessages, sendTransactionMessage } from '@/app/actions/messages'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Send } from 'lucide-react'

type Message = {
  id: string
  senderId: string
  senderName: string
  body: string
  createdAt: Date | string
}

/**
 * Self-contained: fetches its own data via server actions rather than
 * needing messages threaded down from the page's server-side data fetch,
 * same pattern as NotificationBell. Keeps the transaction detail page's
 * own data flow untouched.
 */
export function TransactionMessages({
  transactionId,
  meId,
}: {
  transactionId: string
  meId: string
}) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getTransactionMessages(transactionId)
      .then(setMessages)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [transactionId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'nearest' })
  }, [messages.length])

  const handleSend = async () => {
    const trimmed = body.trim()
    if (!trimmed) return
    setSending(true)
    setError(null)
    try {
      await sendTransactionMessage(transactionId, trimmed)
      setBody('')
      const updated = await getTransactionMessages(transactionId)
      setMessages(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send message')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="mt-8" aria-labelledby="messages-heading">
      <h2 id="messages-heading" className="text-lg font-medium text-foreground">
        Messages
      </h2>
      <Card className="mt-3 flex flex-col gap-3 p-4">
        <div className="flex max-h-80 flex-col gap-3 overflow-y-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No messages yet. Say hello to coordinate delivery details.
            </p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col gap-0.5 rounded-lg p-2.5 text-sm ${
                  m.senderId === meId
                    ? 'ml-8 bg-primary text-primary-foreground'
                    : 'mr-8 bg-secondary text-secondary-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p
                  className={`text-[11px] ${
                    m.senderId === meId ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  }`}
                >
                  {m.senderId === meId ? 'You' : m.senderName}{' '}
                  &middot;{' '}
                  {new Date(m.createdAt).toLocaleString('en-NG', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write a message..."
            rows={2}
            maxLength={2000}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={sending || !body.trim()} className="self-end">
            <Send className="size-4" aria-hidden="true" />
          </Button>
        </div>
        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </Card>
    </section>
  )
}
