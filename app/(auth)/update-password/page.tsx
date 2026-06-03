'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Parolele nu coincid.'); return }
    if (password.length < 8) { setError('Parola trebuie să aibă minim 8 caractere.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError('Link-ul a expirat sau este invalid. Contactează-ne pentru asistență.')
      setLoading(false)
      return
    }
    router.push('/dashboard')
  }

  const strength = password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10B981']
  const strengthLabels = ['', 'Slabă', 'Medie', 'Puternică']

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-black/[.06] px-5 h-16 flex items-center">
        <div className="max-w-5xl mx-auto w-full">
          <Link href="/">
            <Image src="/logo.png" alt="Mentorat cu Roxana" width={140} height={46}
              className="h-11 w-auto object-contain" priority/>
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">

          {/* Icon */}
          <div className="flex justify-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#ED03E9] to-[#6B00E8] flex items-center justify-center shadow-xl shadow-[#ED03E9]/25">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="w-8 h-8">
                <rect x="3" y="11" width="18" height="11" rx="2"/>
                <path d="M7 11V7a5 5 0 0110 0v4" strokeLinecap="round"/>
              </svg>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold font-serif text-[#0A0A0A]">Setează parola</h1>
            <p className="text-[#737373] font-sans text-sm mt-2">Alege o parolă sigură pentru contul tău</p>
          </div>

          <div className="bg-white rounded-3xl border border-black/[.06] p-7 shadow-sm">
            <form onSubmit={handleUpdate} className="space-y-5">

              {/* Parolă */}
              <div>
                <label className="block text-xs font-bold text-[#737373] mb-2 font-sans uppercase tracking-wider">
                  Parolă nouă
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required minLength={8}
                    placeholder="Minim 8 caractere"
                    className="w-full bg-[#FAFAFA] border border-black/[.09] rounded-xl px-4 py-3 pr-11 font-sans text-[15px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/12 focus:border-[#ED03E9]/60 placeholder:text-[#ABABAB] transition-colors"
                  />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#737373] transition-colors p-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4.5 h-4.5 w-[18px] h-[18px]">
                      {showPass
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round"/><path d="M1 1l22 22" strokeLinecap="round"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
                {/* Strength bar */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1,2,3].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-300"
                          style={{ background: i <= strength ? strengthColors[strength] : '#E5E7EB' }}/>
                      ))}
                    </div>
                    <p className="text-[11px] font-sans font-semibold" style={{ color: strengthColors[strength] }}>
                      {strengthLabels[strength]}
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmare */}
              <div>
                <label className="block text-xs font-bold text-[#737373] mb-2 font-sans uppercase tracking-wider">
                  Confirmă parola
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    required
                    placeholder="Repetă parola"
                    className="w-full bg-[#FAFAFA] border border-black/[.09] rounded-xl px-4 py-3 pr-11 font-sans text-[15px] text-[#0A0A0A] focus:outline-none focus:ring-2 focus:ring-[#ED03E9]/12 focus:border-[#ED03E9]/60 placeholder:text-[#ABABAB] transition-colors"
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ABABAB] hover:text-[#737373] transition-colors p-1">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[18px] h-[18px]">
                      {showConfirm
                        ? <><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" strokeLinecap="round"/><path d="M1 1l22 22" strokeLinecap="round"/></>
                        : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
                      }
                    </svg>
                  </button>
                </div>
                {confirm.length > 0 && password !== confirm && (
                  <p className="text-[11px] text-red-500 font-sans mt-1">Parolele nu coincid</p>
                )}
              </div>

              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3 font-sans flex items-start gap-2">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01" strokeLinecap="round"/>
                  </svg>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading || password !== confirm || password.length < 8}
                className="group relative w-full bg-gradient-to-r from-[#ED03E9] to-[#6B00E8] text-white font-sans font-bold py-3.5 rounded-2xl transition-all shadow-xl shadow-[#ED03E9]/20 hover:shadow-[#ED03E9]/35 active:scale-[.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden">
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700 pointer-events-none" />
                {loading ? (
                  <><svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Se salvează...</>
                ) : (
                  <><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Salvează parola și intră</>
                )}
              </button>

            </form>
          </div>

          <p className="text-center text-xs text-[#ABABAB] font-sans mt-5">
            Ai nevoie de ajutor?{' '}
            <a href="mailto:roxana@roxii-dinca.com" className="text-[#ED03E9] hover:underline">Contactează-ne</a>
          </p>
        </div>
      </div>
    </div>
  )
}
