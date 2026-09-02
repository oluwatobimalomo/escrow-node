'use client'

import * as React from 'react'
import { Toast as ToastPrimitive } from '@base-ui/react/toast'

import { cn } from '@/lib/utils'
import { XIcon } from 'lucide-react'

// A single global manager, created once, so any client component can fire
// a toast imperatively (toastManager.add({...})) without needing to be a
// descendant of a specific context provider that passes down a hook value.
// <Toaster /> below just needs to be mounted once, anywhere in the tree —
// see app/dashboard/layout.tsx.
export const toastManager = ToastPrimitive.createToastManager()

const TYPE_STYLES: Record<string, string> = {
  success: 'border-success/40',
  error: 'border-destructive/40',
  default: 'border-border',
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toast) => (
    <ToastPrimitive.Root
      key={toast.id}
      toast={toast}
      className={cn(
        'relative flex w-full items-start gap-3 rounded-xl border bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/10 transition-all duration-200 data-[ending-style]:opacity-0 data-[starting-style]:translate-y-2 data-[starting-style]:opacity-0 data-[ending-style]:translate-x-4',
        TYPE_STYLES[toast.type ?? 'default'] ?? TYPE_STYLES.default,
      )}
    >
      <ToastPrimitive.Content className="flex min-w-0 flex-1 flex-col gap-0.5">
        {toast.title && (
          <ToastPrimitive.Title className="text-sm font-medium text-foreground" />
        )}
        {toast.description && (
          <ToastPrimitive.Description className="text-sm text-muted-foreground" />
        )}
      </ToastPrimitive.Content>
      <ToastPrimitive.Close
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
        aria-label="Dismiss"
      >
        <XIcon className="size-4" />
      </ToastPrimitive.Close>
    </ToastPrimitive.Root>
  ))
}

/**
 * Mount this once near the root of the app (see app/dashboard/layout.tsx).
 * Renders nothing visible until a toast is fired via `toastManager.add(...)`
 * from anywhere in a client component.
 */
export function Toaster() {
  return (
    <ToastPrimitive.Provider toastManager={toastManager}>
      <ToastPrimitive.Portal>
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2 outline-none sm:bottom-6 sm:right-6">
          <ToastList />
        </ToastPrimitive.Viewport>
      </ToastPrimitive.Portal>
    </ToastPrimitive.Provider>
  )
}
