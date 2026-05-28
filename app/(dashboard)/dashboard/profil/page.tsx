'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilPage() {
  const [profile, setProfile] = useState<{ full_name: string; phone: string; email: string } | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState('')

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('full_name, phone, email').eq('id', user.id).single()
      if (data) {
        setProfile(data)
        setFullName(data.full_name || '')
        setPhone(data.phone || '')
      }
    }
    load()
  }, [])

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw.length < 8) { setPwMsg('Parola trebuie să aibă minim 8 caractere.'); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPw })
    if (error) setPwMsg('Eroare. Încearcă din nou.')
    else { setPwMsg('Parola a fost schimbată cu succes! ✓'); setCurrentPw(''); setNewPw('') }
    setPwSaving(false)
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Profilul meu</h1>
        <p className="text-gray-500 font-sans mt-1">Actualizează datele tale personale</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold font-serif mb-4">Date personale</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Nume complet</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Telefon</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+40..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Email</label>
            <input type="email" value={profile?.email || ''} disabled
              className="w-full border border-gray-100 rounded-xl px-4 py-3 font-sans text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {saved ? '✓ Salvat!' : saving ? 'Se salvează...' : 'Salvează modificările'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-bold font-serif mb-4">Schimbă parola</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Parolă nouă</label>
            <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} minLength={8} required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
          </div>
          {pwMsg && (
            <p className={`text-sm font-sans ${pwMsg.includes('succes') ? 'text-green-600' : 'text-red-600'}`}>{pwMsg}</p>
          )}
          <button type="submit" disabled={pwSaving}
            className="w-full bg-gray-800 hover:bg-gray-700 text-white font-sans font-semibold py-3 rounded-xl transition-colors disabled:opacity-60">
            {pwSaving ? 'Se schimbă...' : 'Schimbă parola'}
          </button>
        </form>
      </div>
    </div>
  )
}
