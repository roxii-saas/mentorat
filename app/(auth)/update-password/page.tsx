'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError('Parolele nu coincid.'); return }
    if (password.length < 8) { setError('Parola trebuie să aibă minim 8 caractere.'); return }
    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) { setError('Eroare la actualizare. Încearcă din nou.'); setLoading(false); return }
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#fdf8f3] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-serif text-gray-900">Parolă nouă</h1>
          <p className="text-gray-500 mt-2 font-sans">Alege o parolă sigură</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleUpdate} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Parolă nouă</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Confirmă parola</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
            </div>
            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 font-sans">{error}</div>}
            <button type="submit" disabled={loading}
              className="w-full bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60">
              {loading ? 'Se salvează...' : 'Salvează parola nouă'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
