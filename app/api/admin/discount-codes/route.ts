import { NextResponse } from 'next/server'
import { isAdminRequest } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const deny = () => NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })
const iso = (v: unknown) => (typeof v === 'string' && v && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : null)
const CODE_RE = /^[A-Za-z0-9_-]{3,30}$/

export async function GET(req: Request) {
  if (!(await isAdminRequest())) return deny()
  const productId = new URL(req.url).searchParams.get('product_id')
  if (!productId) return NextResponse.json({ error: 'product_id lipsește' }, { status: 400 })
  const { data, error } = await createAdminClient().from('discount_codes').select('*').eq('product_id', productId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  if (!(await isAdminRequest())) return deny()
  const b = await req.json().catch(() => ({}))
  const code = String(b.code ?? '').trim()
  const value = Math.round(Number(b.value))
  const starts = iso(b.starts_at), ends = iso(b.ends_at)
  const maxUses = b.max_uses === '' || b.max_uses == null ? null : Math.round(Number(b.max_uses))
  if (!b.product_id) return NextResponse.json({ error: 'Produs lipsă.' }, { status: 400 })
  if (!CODE_RE.test(code)) return NextResponse.json({ error: 'Codul are 3–30 de caractere: litere, cifre, - sau _.' }, { status: 400 })
  if (!['percent', 'amount', 'price'].includes(b.type)) return NextResponse.json({ error: 'Tip de reducere invalid.' }, { status: 400 })
  if (!Number.isFinite(value) || value < 1) return NextResponse.json({ error: 'Valoarea trebuie să fie cel puțin 1.' }, { status: 400 })
  if (b.type === 'percent' && value > 99) return NextResponse.json({ error: 'Procentul poate fi cel mult 99.' }, { status: 400 })
  if (starts && ends && Date.parse(ends) <= Date.parse(starts)) return NextResponse.json({ error: 'Data de final trebuie să fie după cea de început.' }, { status: 400 })
  if (maxUses != null && (!Number.isFinite(maxUses) || maxUses < 1)) return NextResponse.json({ error: 'Numărul maxim de utilizări trebuie să fie cel puțin 1.' }, { status: 400 })

  const { data, error } = await createAdminClient().from('discount_codes').insert({
    product_id: b.product_id, code, type: b.type, value, starts_at: starts, ends_at: ends, max_uses: maxUses,
  }).select('*').single()
  if (error) return NextResponse.json({ error: error.code === '23505' ? 'Există deja un cod cu acest nume la acest produs.' : error.message }, { status: error.code === '23505' ? 409 : 400 })
  return NextResponse.json(data)
}

export async function PATCH(req: Request) {
  if (!(await isAdminRequest())) return deny()
  const b = await req.json().catch(() => ({}))
  if (!b.id || typeof b.active !== 'boolean') return NextResponse.json({ error: 'Date lipsă.' }, { status: 400 })
  const { data, error } = await createAdminClient().from('discount_codes').update({ active: b.active }).eq('id', b.id).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  if (!(await isAdminRequest())) return deny()
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id lipsește' }, { status: 400 })
  const { error } = await createAdminClient().from('discount_codes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
