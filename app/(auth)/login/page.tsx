'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="min-h-screen bg-[#FAFAFA] relative overflow-hidden flex flex-col">
      {/* Background blobs */}
      <div className="absolute top-0 -left-32 w-96 h-96 rounded-full bg-[#ED03E9]/8 hidden md:block blur-[80px] pointer-events-none" />
      <div className="absolute bottom-0 -right-32 w-96 h-96 rounded-full bg-[#6B00E8]/8 hidden md:block blur-[80px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 sm:px-8 py-4">
        <Link href="/">
          <Image src="/logo.png" alt="Mentorat cu Roxana" width={140} height={46}
            className="h-11 w-auto object-contain" priority/>
        </Link>
        <Link href="/" className="text-sm text-[#737373] hover:text-[#ED03E9] font-sans font-medium transition-colors flex items-center gap-1.5">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
            <path d="M12 5L7 10l5 5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Înapoi la site
        </Link>
      </header>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-[400px]">

          <div className="text-center mb-7">
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0A0A0A]">Bine ai revenit</h1>
            <p className="text-[#737373] mt-1.5 font-sans text-sm">Intră în contul tău de mentorat</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-black/[.06] p-7">
            <form onSubmit={handleLogin} className="space-y-4">

              <div>
                <label className="block text-xs font-bold text-[#737373] mb-2 font-sans uppercase tracking-wider">
                  Email
                </label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required placeholder="adresa@email.com"
                  className="w-full bg-[#FAFAFA] border border-black/[.09] rounded-xl px-4 py-3 font-sans text-[15px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/12 focus:border-[#ED03E9]/60 placeholder:text-[#ABABAB] transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-[#737373] font-sans uppercase tracking-wider">
                    Parolă
                  </label>
                  <Link href="/reset-password" className="text-[11px] text-[#ED03E9] hover:underline font-sans font-semibold">
                    Ai uitat parola?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••"
                    className="w-full bg-[#FAFAFA] border border-black/[.09] rounded-xl px-4 py-3 pr-11 font-sans text-[15px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/12 focus:border-[#ED03E9]/60 placeholder:text-[#ABABAB] transition-colors"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#737373] transition-colors p-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                      {showPassword
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round"/><path d="M1 1l22 22" strokeLinecap="round"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 font-sans">
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <circle cx="10" cy="10" r="8"/><path d="M10 6v4M10 14h.01" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading}
                className="group relative w-full bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white font-sans font-bold py-3.5 rounded-2xl transition-all shadow-xl shadow-[#ED03E9]/20 hover:shadow-[#ED03E9]/35 active:scale-[.99] disabled:opacity-60 flex items-center justify-center gap-2 overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none" />
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Se conectează...</>
                ) : 'Intră în cont'}
              </button>

            </form>
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
