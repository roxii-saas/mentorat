import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePassword } from '@/lib/utils'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Non autenticato' }, { status: 401 })
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Non autorizzato' }, { status: 403 })

  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId mancante' }, { status: 400 })

  const admin = createAdminClient()
  const { data: { user: targetUser }, error } = await admin.auth.admin.getUserById(userId)
  if (error || !targetUser?.email) return NextResponse.json({ error: 'Utente non trovato' }, { status: 404 })

  const { data: targetProfile } = await admin.from('profiles').select('full_name, phone').eq('id', userId).single()

  // Genera nuova password e aggiorna l'utente
  const tempPassword = generatePassword(14)
  await admin.auth.admin.updateUserById(userId, { password: tempPassword })

  // Chiama Edge Function
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'SUPABASE_URL o SERVICE_ROLE_KEY mancante' }, { status: 500 })
  }

  const res = await fetch(`${supabaseUrl}/functions/v1/send-welcome-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
    body: JSON.stringify({
      email: targetUser.email,
      name: targetProfile?.full_name || targetUser.email,
      userId,
      phone: targetProfile?.phone || '',
    }),
  })

  const data = await res.json()
  if (!res.ok) return NextResponse.json({ error: 'Edge Function fallita', details: data }, { status: 500 })
  return NextResponse.json({ ok: true, message: `Email reinviata a ${targetUser.email}` })
}
