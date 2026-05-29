'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError('Email sau parolă incorectă. Verifică datele și încearcă din nou.')
      setLoading(false)
      return
    }

    const metaRole = data.user.user_metadata?.role
    if (metaRole === 'admin') { router.push('/admin'); return }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden">
      <div className="absolute top-0 -left-32 w-96 h-96 rounded-full bg-[#ED03E9]/8 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-[#6B00E8]/8 blur-[100px] pointer-events-none" />

      <Link href="/" className="absolute top-5 left-5 z-10 inline-flex items-center gap-1.5 text-[#737373] hover:text-[#ED03E9] font-sans text-sm font-medium px-3 py-2 rounded-xl hover:bg-white/60 transition-all">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Înapoi la site
      </Link>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-[400px]">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-[#ED03E9] rounded-xl flex items-center justify-center shadow-lg shadow-[#ED03E9]/30">
                <svg viewBox="0 0 20 20" fill="none" stroke="white" strokeWidth="2.2" className="w-5 h-5">
                  <path d="M10 2L3 6l7 4 7-4-7-4zM3 13l7 4 7-4M3 9.5l7 4 7-4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
            <h1 className="text-2xl font-serif font-bold text-[#0A0A0A]">Bine ai revenit</h1>
            <p className="text-[#737373] mt-1.5 font-sans text-sm">Intră în contul tău de mentorat</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-black/6 p-7">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#3D3D3D] mb-1.5 font-sans">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="adresa@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/25 focus:border-[#ED03E9] placeholder:text-gray-300 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#3D3D3D] mb-1.5 font-sans">Parolă</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-[#0A0A0A] bg-white focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/25 focus:border-[#ED03E9] placeholder:text-gray-300 transition-colors" />
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 font-sans">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#ED03E9] hover:bg-[#B800BA] text-white font-sans font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60 shadow-md shadow-[#ED03E9]/20 hover:shadow-lg hover:shadow-[#ED03E9]/25 active:scale-[.99]">
                {loading ? 'Se conectează...' : 'Intră în cont'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link href="/reset-password" className="text-sm text-[#ED03E9] hover:underline font-sans">Ai uitat parola?</Link>
            </div>
          </div>

          <p className="text-center mt-5 text-sm text-[#737373] font-sans">
            Nu ai cont?{' '}
            <Link href="/" className="text-[#ED03E9] hover:underline font-semibold">Cumpără programul →</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
