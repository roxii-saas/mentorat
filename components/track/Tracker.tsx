'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { trackEvent, trackPageView, trackingAllowed } from '@/lib/track'

const HEARTBEAT_MS = 30_000

// Urmărește vizita pe paginile publice: pagina vizualizată, derularea (25/50/75/100%), timpul activ și clicurile pe butoanele de cumpărare.
// Nu folosește cookie-uri și nu citește nimic din formulare.
export default function Tracker() {
  const pathname = usePathname()
  const first = useRef(true)

  useEffect(() => {
    if (!trackingAllowed()) return
    trackPageView(first.current)
    first.current = false
  }, [pathname])

  // "Bătaie de inimă": doar cât timp fila este vizibilă → știm cine este pe site ACUM și cât timp este activ
  useEffect(() => {
    if (!trackingAllowed()) return
    const t = setInterval(() => { if (document.visibilityState === 'visible') trackEvent('hb', { ms: HEARTBEAT_MS }) }, HEARTBEAT_MS)
    return () => clearInterval(t)
  }, [pathname])

  // Cât de jos a ajuns pe pagină
  useEffect(() => {
    if (!trackingAllowed()) return
    const marks = [25, 50, 75, 100]
    const done = new Set<number>()
    let raf = 0
    const check = () => {
      raf = 0
      const h = document.documentElement.scrollHeight
      if (h <= 0) return
      const pct = ((window.scrollY + window.innerHeight) / h) * 100
      for (const m of marks) if (!done.has(m) && pct >= (m === 100 ? 95 : m)) { done.add(m); trackEvent('scroll', { s: m }) }
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(check) }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); if (raf) cancelAnimationFrame(raf) }
  }, [pathname])

  // Clic pe un buton de cumpărare (link către checkout sau element marcat cu data-track)
  useEffect(() => {
    if (!trackingAllowed()) return
    const onClick = (e: MouseEvent) => {
      const el = (e.target as Element | null)?.closest?.('a[href*="checkout"], [data-track]')
      if (el) trackEvent('click', { d: el.getAttribute('data-track') || 'checkout' })
    }
    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [pathname])

  return null
}
