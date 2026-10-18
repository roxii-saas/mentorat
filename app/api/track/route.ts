import { createAdminClient } from '@/lib/supabase/admin'
import { BOT_RE, buildPayload, parseUA, readGeo, sanitizeBody, visitorId } from '@/lib/track-server'
import { bucharestDay } from '@/lib/admin-analytics'

// Statistici proprii, fără cookie-uri. Primește evenimentele din browser și le trece la funcția SQL track_visit.
// Nu rupe niciodată o pagină: orice problemă → 204 (nimic înregistrat).
const done = () => new Response(null, { status: 204 })

// Frână simplă împotriva abuzurilor (per instanță): max. 120 de evenimente/minut pentru același cod anonim
const hits = new Map<string, { n: number; reset: number }>()
function tooMany(vid: string) {
  const now = Date.now()
  const h = hits.get(vid)
  if (!h || h.reset < now) {
    if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k)
    hits.set(vid, { n: 1, reset: now + 60_000 })
    return false
  }
  return ++h.n > 120
}

export async function POST(req: Request) {
  try {
    const h = req.headers
    // Respectăm "Do Not Track" și Global Privacy Control
    if (h.get('dnt') === '1' || h.get('sec-gpc') === '1') return done()

    const uaRaw = h.get('user-agent') ?? ''
    if (!uaRaw || BOT_RE.test(uaRaw)) return done()                       // roboți, previzualizări de link
    if (/(^|;\s*)sb-[a-z0-9]+-auth-token/i.test(h.get('cookie') ?? '')) return done()   // utilizatori autentificați (admin / cliente): nu sunt vizitatori

    const host = h.get('host') ?? ''
    const origin = h.get('origin')
    if (origin) { try { if (new URL(origin).host !== host) return done() } catch { return done() } }

    const text = await req.text()
    if (!text || text.length > 2000) return done()
    let raw: unknown
    try { raw = JSON.parse(text) } catch { return done() }
    const body = sanitizeBody(raw)
    if (!body) return done()

    const secret = process.env.TRACK_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!secret) return done()

    // IP-ul se folosește DOAR aici, pentru codul anonim zilnic; nu se salvează nicăieri
    const ip = (h.get('x-forwarded-for') ?? '').split(',')[0].trim() || h.get('x-real-ip') || ''
    const vid = visitorId(secret, bucharestDay(new Date()), ip, uaRaw)
    if (tooMany(vid)) return done()

    const payload = buildPayload({ body, vid, ua: parseUA(uaRaw), geo: readGeo(h), ownHost: host })
    const supabase = createAdminClient()
    const { error } = await supabase.rpc('track_visit', { p: payload })
    if (error) console.error('[Track] track_visit:', error.message)

    // Păstrare 90 de zile: curățare ocazională (1 din ~400 de cereri)
    if (Math.random() < 1 / 400) await supabase.rpc('purge_visitor_data', { p_days: 90 })
  } catch (e) {
    console.error('[Track] eroare:', e instanceof Error ? e.message : e)
  }
  return done()
}
