import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { addDays, bucharestDay, bucharestMidnightUtc } from '@/lib/admin-analytics'

// Date pentru pagina "Live" (doar admin; în plus, funcțiile SQL sunt SECURITY INVOKER → baza de date refuză oricui nu e admin).
//   ?part=now&s=600      → vizitatorii activi în ultimele s secunde
//   ?part=summary&w=...  → imbuto, surse, țări, orașe, dispozitive, pagini, hartă de căldură (now | today | yesterday | 7d | 30d)
//   ?part=session&id=... → cronologia unui vizitator
const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return json({ error: 'Non autorizzato' }, 403)
  const url = new URL(req.url)
  const part = url.searchParams.get('part')
  const supabase = await createClient()

  if (part === 'now') {
    const s = Math.min(86400, Math.max(30, Number(url.searchParams.get('s')) || 600))
    const { data, error } = await supabase.rpc('admin_live_now', { p_seconds: s })
    return error ? json({ error: error.message }, 500) : json(data)
  }

  if (part === 'session') {
    const id = url.searchParams.get('id') ?? ''
    if (!UUID.test(id)) return json({ error: 'id invalid' }, 400)
    const { data, error } = await supabase.rpc('admin_session_events', { p_session: id })
    return error ? json({ error: error.message }, 500) : json(data)
  }

  if (part === 'summary') {
    const today = bucharestDay(new Date())
    const w = url.searchParams.get('w') ?? 'today'
    const now = Date.now()
    let from: Date, to: Date = new Date(now + 60_000)
    if (w === 'now') from = new Date(now - 30 * 60_000)
    else if (w === 'yesterday') { from = bucharestMidnightUtc(addDays(today, -1)); to = bucharestMidnightUtc(today) }
    else if (w === '7d') from = bucharestMidnightUtc(addDays(today, -6))
    else if (w === '30d') from = bucharestMidnightUtc(addDays(today, -29))
    else from = bucharestMidnightUtc(today)
    const { data, error } = await supabase.rpc('admin_live_summary', { p_from: from.toISOString(), p_to: to.toISOString() })
    return error ? json({ error: error.message }, 500) : json(data)
  }

  return json({ error: 'part necunoscut' }, 400)
}
