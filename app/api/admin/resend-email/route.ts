import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  const { purchaseId } = await req.json()
  if (!purchaseId) return NextResponse.json({ error: 'purchaseId mancante' }, { status: 400 })

  const admin = createAdminClient()
  const { data: purchase, error } = await admin
    .from('purchases')
    .select('email, name, phone, amount, currency')
    .eq('id', purchaseId)
    .single()

  if (error || !purchase?.email) return NextResponse.json({ error: 'Acquisto non trovato' }, { status: 404 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Env mancanti' }, { status: 500 })

  const res = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${serviceKey}` },
    body: JSON.stringify({
      email: purchase.email,
      name: purchase.name || purchase.email,
      phone: purchase.phone || '',
      amount: purchase.amount,
      currency: purchase.currency,
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: 'Edge Function fallita', details: data }, { status: 500 })
  return NextResponse.json({ ok: true, message: `Email reinviata a ${purchase.email}` })
}
