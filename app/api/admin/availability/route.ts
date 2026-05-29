import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

async function verifyAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  if (user.user_metadata?.role === 'admin') return user
  const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return data?.role === 'admin' ? user : null
}

export async function GET() {
  const db = createAdminClient()
  const today = new Date().toISOString().split('T')[0]
  const { data } = await db.from('availability').select('*').gte('date', today).order('date').order('start_time')
  return NextResponse.json(data ?? [])
}

export async function POST(req: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { dates, start_time, end_time } = await req.json()
  const db = createAdminClient()

  const rows = (dates as string[]).map(date => ({ date, start_time, end_time, is_booked: false }))
  const { data, error } = await db
    .from('availability')
    .upsert(rows, { onConflict: 'date,start_time', ignoreDuplicates: true })
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: Request) {
  const user = await verifyAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const db = createAdminClient()
  const { error } = await db.from('availability').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
