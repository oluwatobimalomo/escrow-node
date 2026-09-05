'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

/**
 * No PDF library needed -- the browser's own "Print > Save as PDF" covers
 * this perfectly, and the receipt page's print:hidden classes hide
 * everything except the receipt itself when this fires.
 */
export function PrintReceiptButton() {
  return (
    <Button onClick={() => window.print()} size="sm">
      <Printer className="size-4" aria-hidden="true" />
      Print / Save as PDF
    </Button>
  )
}
