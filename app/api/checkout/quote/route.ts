import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { quote } from '@/lib/checkout-price'

// Prețul de plată pentru un produs (+ cod de reducere + upgrade). Folosit de checkout pentru afișare; plata recalculează oricum pe server.
const hits = new Map<string, { n: number; t: number }>()

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? 'x').split(',')[0].trim()
  const now = Date.now()
  const h = hits.get(ip)
  if (!h || now - h.t > 60_000) hits.set(ip, { n: 1, t: now })
  else if (++h.n > 30) return NextResponse.json({ ok: false, error: 'Prea multe încercări. Așteaptă un minut.' }, { status: 429 })
  if (hits.size > 5000) hits.clear()

  const body = await req.json().catch(() => ({}))
  const q = await quote(createAdminClient(), String(body.slug ?? ''), body.code, !!body.bump)
  if (!q.ok) return NextResponse.json({ ok: false, error: q.error }, { status: q.status })
  // id-ul intern al codului nu iese din server
  return NextResponse.json({ ...q, code: q.code ? { code: q.code.code, label: q.code.label } : null })
}
