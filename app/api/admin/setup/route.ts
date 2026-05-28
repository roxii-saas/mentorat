import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Chiamata UNA SOLA VOLTA per creare l'account admin di Roxana
// Protetta da un secret token
export async function POST(req: Request) {
  const { token, email, password } = await req.json()

  if (token !== process.env.ADMIN_SETUP_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Roxana Dinca', role: 'admin' },
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Aggiorna il ruolo nel profilo
  await supabase.from('profiles').update({ role: 'admin', full_name: 'Roxana Dinca' }).eq('id', data.user.id)

  return NextResponse.json({ success: true, userId: data.user.id })
}
