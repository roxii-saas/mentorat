'use client'

import { useEffect } from 'react'
import { trackEvent } from '@/lib/track'

// Pe paginile de mulțumire: marchează vizitatorul ca "a cumpărat" (legat de comandă prin id-ul plății)
export default function TrackPurchase({ pi, product, value, currency }: { pi: string; product: string; value: number; currency: string }) {
  useEffect(() => {
    trackEvent('purchase', { pi, pr: product, v: Math.round(value), c: currency.toLowerCase() })
  }, [pi, product, value, currency])
  return null
}
