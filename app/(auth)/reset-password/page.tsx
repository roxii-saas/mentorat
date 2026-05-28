'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#fdf8f3] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-serif text-gray-900">Recuperare parolă</h1>
          <p className="text-gray-500 mt-2 font-sans">Îți trimitem un link pe email</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {sent ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="font-bold text-xl mb-2 font-serif">Email trimis!</h2>
              <p className="text-gray-600 font-sans text-sm">
                Am trimis un link de resetare la <strong>{email}</strong>. Verifică și inbox-ul și spam-ul.
              </p>
              <Link href="/login" className="inline-block mt-6 text-[#c97d4e] hover:underline font-sans text-sm">
                ← Înapoi la login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Email-ul contului tău</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="adresa@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
              >
                {loading ? 'Se trimite...' : 'Trimite link de resetare'}
              </button>
              <div className="text-center">
                <Link href="/login" className="text-sm text-gray-500 hover:text-[#c97d4e] font-sans">
                  ← Înapoi la login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
