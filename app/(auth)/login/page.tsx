'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
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
    if (metaRole === 'admin') {
      router.push('/admin'); return
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    router.push(profile?.role === 'admin' ? '/admin' : '/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#fdf8f3] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-20 w-72 h-72 bg-[#c97d4e]/15 rounded-full blur-3xl" />
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-[#f5d5b8]/30 rounded-full blur-3xl" />

      {/* Back to home (sticky top) */}
      <Link href="/" className="absolute top-5 left-5 z-10 flex items-center gap-2 text-gray-600 hover:text-[#c97d4e] font-sans text-sm font-medium px-3 py-2 rounded-xl hover:bg-white/50 transition-all">
        <ArrowLeft className="w-4 h-4" />
        Înapoi la site
      </Link>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-[#c97d4e] to-[#a85e35] rounded-xl flex items-center justify-center shadow-lg">
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-gray-900">Bine ai revenit</h1>
            <p className="text-gray-500 mt-2 font-sans text-sm">Intră în contul tău de mentorat</p>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="adresa@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Parolă</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-sans">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-gradient-to-r from-[#c97d4e] to-[#a85e35] hover:from-[#b86d3e] hover:to-[#984e25] text-white font-sans font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 shadow-md hover:shadow-lg">
                {loading ? 'Se conectează...' : 'Intră în cont'}
              </button>
            </form>

            <div className="mt-5 text-center">
              <Link href="/reset-password" className="text-sm text-[#c97d4e] hover:underline font-sans">
                Ai uitat parola?
              </Link>
            </div>
          </div>

          <p className="text-center mt-6 text-sm text-gray-500 font-sans">
            Nu ai cont încă?{' '}
            <Link href="/" className="text-[#c97d4e] hover:underline font-semibold">
              Cumpără programul →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
