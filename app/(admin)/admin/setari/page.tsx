'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SetariPage() {
  const [settings, setSettings] = useState({
    price_amount: 297, currency: 'eur',
    product_name: 'Mentorat Premium cu Roxana',
    product_description: 'De la 0 la 3000€ — Strategii personalizate pentru succesul tău online',
    sales_active: true,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data } = await supabase.from('platform_settings').select('*').single()
      if (data) setSettings(data)
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    await supabase.from('platform_settings').update({ ...settings, updated_at: new Date().toISOString() }).eq('id', 1)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  const currencies = [
    { value: 'eur', label: 'EUR · Euro (€)' },
    { value: 'ron', label: 'RON · Leu românesc' },
    { value: 'usd', label: 'USD · Dolar american ($)' },
    { value: 'gbp', label: 'GBP · Liră sterlină (£)' },
    { value: 'chf', label: 'CHF · Franc elvețian' },
  ]

  const preview = settings.sales_active
    ? `"Vreau să mă transform — ${new Intl.NumberFormat('ro-RO', { style: 'currency', currency: settings.currency.toUpperCase() }).format(settings.price_amount)}"`
    : '"Lista de așteptare — în curând"'

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#c97d4e] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">Setări platformă</h1>
        <p className="text-gray-400 font-sans text-sm mt-0.5">Modifică prețul și configurarea mentorat-ului</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* Preț */}
        <div className="bg-gray-900 rounded-2xl border border-white/5 p-5 sm:p-6">
          <h2 className="font-serif font-bold text-white mb-4 text-base sm:text-lg">💰 Preț și produs</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5 font-sans">Preț</label>
              <input type="number" min="1" value={settings.price_amount}
                onChange={e => setSettings(s => ({ ...s, price_amount: parseInt(e.target.value) || 0 }))}
                className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5 font-sans">Monedă</label>
              <select value={settings.currency}
                onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
                className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]">
                {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-1.5 font-sans">Nume produs</label>
            <input type="text" value={settings.product_name}
              onChange={e => setSettings(s => ({ ...s, product_name: e.target.value }))}
              className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-1.5 font-sans">Descriere (apare în Stripe)</label>
            <textarea value={settings.product_description} rows={2}
              onChange={e => setSettings(s => ({ ...s, product_description: e.target.value }))}
              className="w-full bg-gray-800 border border-white/10 text-white rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e] resize-none" />
          </div>
        </div>

        {/* Vânzări */}
        <div className="bg-gray-900 rounded-2xl border border-white/5 p-5 sm:p-6">
          <h2 className="font-serif font-bold text-white mb-1 text-base sm:text-lg">🔘 Starea vânzărilor</h2>
          <p className="text-sm text-gray-500 font-sans mb-4">Când sunt oprite, butonul devine "Lista de așteptare".</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSettings(s => ({ ...s, sales_active: !s.sales_active }))}
              className={`relative inline-flex h-7 w-13 items-center rounded-full transition-colors w-12 ${settings.sales_active ? 'bg-[#c97d4e]' : 'bg-gray-700'}`}>
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.sales_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`font-sans font-semibold text-sm ${settings.sales_active ? 'text-green-400' : 'text-gray-500'}`}>
              {settings.sales_active ? 'Vânzări active ✓' : 'Vânzări oprite'}
            </span>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-[#c97d4e]/10 rounded-2xl p-4 border border-[#c97d4e]/20">
          <p className="text-xs font-sans text-gray-400 mb-1 uppercase tracking-wider font-bold">Preview buton landing</p>
          <p className="text-sm font-sans text-white">{preview}</p>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 shadow-lg hover:shadow-xl active:scale-95">
          {saved ? '✓ Salvat cu succes!' : saving ? 'Se salvează...' : 'Salvează setările'}
        </button>
      </form>
    </div>
  )
}
