import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('availability').select('*')
    .gte('date', today).order('date').order('start_time')
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { dates, start_time, end_time } = await req.json()
  const rows = (dates as string[]).map(date => ({ date, start_time, end_time, is_booked: false }))

  // RLS verifica is_admin() prima di permettere l'inserimento
  const { data, error } = await supabase
    .from('availability')
    .upsert(rows, { onConflict: 'date,start_time', ignoreDuplicates: true })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 403 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  const { id } = await req.json()
  const { error } = await supabase.from('availability').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 403 })
  return NextResponse.json({ success: true })
}
