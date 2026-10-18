import { isPrivatePath } from '@/lib/private-paths'

// Statistici proprii, fără cookie-uri: nu se scrie nimic pe dispozitiv (nici cookie, nici localStorage).
// Serverul recunoaște vizitatorul printr-un cod anonim zilnic (vezi lib/track-server.ts).
type Extra = { s?: number; ms?: number; d?: string; pr?: string; v?: number; c?: string; pi?: string }

export function trackingAllowed(): boolean {
  if (typeof window === 'undefined') return false
  const n = navigator as Navigator & { globalPrivacyControl?: boolean; msDoNotTrack?: string }
  if (n.doNotTrack === '1' || (window as unknown as { doNotTrack?: string }).doNotTrack === '1' || n.msDoNotTrack === '1' || n.globalPrivacyControl === true) return false
  return !isPrivatePath(location.pathname)
}

function post(body: object) {
  const data = JSON.stringify(body)
  // sendBeacon: pleacă chiar dacă pagina se închide sau se schimbă imediat după clic
  try { if (navigator.sendBeacon?.('/api/track', new Blob([data], { type: 'text/plain' }))) return } catch {}
  try { void fetch('/api/track', { method: 'POST', body: data, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {}) } catch {}
}

export function trackPageView(first: boolean) {
  if (!trackingAllowed()) return
  // Sursa se trimite doar la prima încărcare a paginii și doar dacă vine de pe ALT site, ca domeniu (fără cale și fără parametri)
  let r = ''
  if (first && document.referrer) {
    try { const u = new URL(document.referrer); if (u.host !== location.host) r = u.origin + '/' } catch {}
  }
  post({ e: 'pv', p: location.pathname, r, q: first ? location.search : '', sw: window.innerWidth, l: navigator.language })
}

export function trackEvent(e: 'hb' | 'scroll' | 'focus' | 'submit' | 'purchase' | 'click', extra: Extra = {}) {
  if (!trackingAllowed()) return
  post({ e, p: location.pathname, ...extra })
}

const sent = new Set<string>()
export function trackOnce(e: 'focus' | 'submit', extra: Extra = {}) {
  const k = `${e}|${location.pathname}`
  if (sent.has(k)) return
  sent.add(k)
  trackEvent(e, extra)
}
