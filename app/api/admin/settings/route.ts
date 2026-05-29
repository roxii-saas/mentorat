import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase.from('platform_settings').select('*').single()
  return NextResponse.json(data)
}

export async function PUT(req: Request) {
  const supabase = await createClient()

  // Verifica che l'utente sia autenticato
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })

  // RLS si occupa del controllo admin tramite is_admin()
  const body = await req.json()
  const { data, error } = await supabase
    .from('platform_settings')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 403 })
  return NextResponse.json(data)
}
