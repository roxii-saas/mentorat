import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type SessionUser = { id: string; email?: string }

// getClaims verifica il JWT in locale (chiavi ES256) → niente chiamata al server Auth.
// cache() → layout e pagina della stessa richiesta condividono il risultato.
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const claims = data?.claims
  if (!claims?.sub) return null
  return { id: claims.sub, email: claims.email as string | undefined }
})

const isAdmin = cache(async () => {
  const supabase = await createClient()
  // Usa la funzione is_admin() di Postgres (SECURITY DEFINER)
  const { data } = await supabase.rpc('is_admin')
  return !!data
})

export const getProfileName = cache(async (userId: string) => {
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('full_name').eq('id', userId).single()
  return data?.full_name ?? undefined
})

export async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  if (!(await isAdmin())) redirect('/dashboard')
  return user
}

// Per le API route: true solo se la richiesta viene da un admin
export async function isAdminRequest() {
  const user = await getSessionUser()
  return !!user && (await isAdmin())
}

export async function requireAuth() {
  const user = await getSessionUser()
  if (!user) redirect('/login')
  return user
}
