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

    // Determina ruolo e redirect
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    if (profile?.role === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-[#fdf8f3] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-serif text-gray-900">Mentorat cu Roxana</h1>
          <p className="text-gray-500 mt-2 font-sans">Intră în contul tău</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="adresa@email.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Parolă</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-sans">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? 'Se conectează...' : 'Intră în cont'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/reset-password" className="text-sm text-[#c97d4e] hover:underline font-sans">
              Ai uitat parola?
            </Link>
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-gray-500 font-sans">
          Nu ai cont?{' '}
          <Link href="/" className="text-[#c97d4e] hover:underline">
            Cumpără programul
          </Link>
        </p>
      </div>
    </div>
  )
}
