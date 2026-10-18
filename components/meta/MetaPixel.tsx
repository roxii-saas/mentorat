'use client'

import { useEffect, useSyncExternalStore } from 'react'
import { usePathname } from 'next/navigation'
import { isPrivatePath } from '@/lib/private-paths'
import {
  META_ENABLED, getConsent, onConsentChange, resetConsent, setConsent,
  startIfConsented, trackPageView,
} from '@/lib/meta/pixel'


export default function MetaPixel() {
  const pathname = usePathname()
  // Il consenso vive in localStorage (stato esterno): sul server è 'loading' → nessun mismatch di idratazione
  const consent = useSyncExternalStore(onConsentChange, getConsent, () => 'loading' as const)
  const framed = useSyncExternalStore(() => () => {}, () => window.self !== window.top, () => false)   // previzualizare în admin
  const priv = isPrivatePath(pathname) || framed

  // Link "Setări cookie" nel footer → riapre il banner
  useEffect(() => {
    window.addEventListener('open-cookie-settings', resetConsent)
    return () => window.removeEventListener('open-cookie-settings', resetConsent)
  }, [])

  useEffect(() => { if (!priv) startIfConsented() }, [priv])
  useEffect(() => { if (!priv) trackPageView() }, [pathname, priv])

  if (!META_ENABLED || priv || consent === 'loading') return null
  if (consent !== 'unknown') return null

  return (
    <div role="dialog" aria-label="Preferințe cookie"
      className="fixed inset-x-0 bottom-0 z-[100] p-3 sm:p-4 pointer-events-none">
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-xl bg-white border border-black/10 shadow-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
        style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif' }}>
        <p className="text-[13px] leading-5 text-[#3D3D3D] flex-1">
          Folosim cookie-uri de marketing (Meta Pixel) pentru a măsura eficiența reclamelor noastre.
          Poți accepta sau refuza — site-ul funcționează la fel în ambele cazuri.{' '}
          <a href="/politica-de-cookie" className="underline underline-offset-2 text-[#0A0A0A] font-medium">Detalii</a>
        </p>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={() => setConsent('denied')}
            className="flex-1 sm:flex-none h-10 px-5 rounded-lg border border-black/20 text-[13px] font-semibold text-[#0A0A0A] hover:bg-black/5 transition-colors">
            Refuz
          </button>
          <button type="button" onClick={() => setConsent('granted')}
            className="flex-1 sm:flex-none h-10 px-5 rounded-lg bg-[#0A0A0A] text-[13px] font-semibold text-white hover:bg-black/80 transition-colors">
            Accept
          </button>
        </div>
      </div>
    </div>
  )
}
