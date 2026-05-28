'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function SetariPage() {
  const [settings, setSettings] = useState({
    price_amount: 297,
    currency: 'eur',
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
    await supabase.from('platform_settings').update({
      ...settings,
      updated_at: new Date().toISOString(),
    }).eq('id', 1)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    setSaving(false)
  }

  if (loading) return <div className="text-center py-12 text-gray-400 font-sans">Se încarcă...</div>

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Setări platformă</h1>
        <p className="text-gray-500 font-sans mt-1">Modifică prețul și configurarea mentorat-ului</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Prezzo */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold font-serif mb-4">Preț și produs</h2>
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Preț</label>
                <input
                  type="number"
                  min="1"
                  value={settings.price_amount}
                  onChange={e => setSettings(s => ({ ...s, price_amount: parseInt(e.target.value) || 0 }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Monedă</label>
                <select
                  value={settings.currency}
                  onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e] bg-white"
                >
                  <option value="eur">EUR · Euro (€)</option>
                  <option value="ron">RON · Leu românesc (lei)</option>
                  <option value="usd">USD · Dolar american ($)</option>
                  <option value="gbp">GBP · Liră sterlină (£)</option>
                  <option value="chf">CHF · Franc elvețian</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-gray-400 font-sans">Prețul și moneda se aplică automat pe landing page și în Stripe.</p>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Nume produs</label>
              <input type="text" value={settings.product_name}
                onChange={e => setSettings(s => ({ ...s, product_name: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e]" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5 font-sans">Descriere (apare în Stripe Checkout)</label>
              <textarea value={settings.product_description} rows={2}
                onChange={e => setSettings(s => ({ ...s, product_description: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 font-sans text-sm focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 focus:border-[#c97d4e] resize-none" />
            </div>
          </div>
        </div>

        {/* Stato vendite */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-bold font-serif mb-1">Starea vânzărilor</h2>
          <p className="text-sm text-gray-500 font-sans mb-4">Când sunt oprite, butonul de cumpărare devine "Lista de așteptare".</p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSettings(s => ({ ...s, sales_active: !s.sales_active }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.sales_active ? 'bg-[#c97d4e]' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.sales_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`font-sans font-semibold text-sm ${settings.sales_active ? 'text-green-600' : 'text-gray-500'}`}>
              {settings.sales_active ? 'Vânzări active ✓' : 'Vânzări oprite'}
            </span>
          </div>
        </div>

        {/* Preview prezzo */}
        <div className="bg-[#c97d4e]/10 rounded-2xl p-4 border border-[#c97d4e]/20">
          <p className="text-sm font-sans text-gray-600">
            <strong>Preview buton landing:</strong>{' '}
            {settings.sales_active
              ? `"Vreau să mă transform — ${new Intl.NumberFormat('ro-RO', { style: 'currency', currency: settings.currency.toUpperCase() }).format(settings.price_amount)}"`
              : '"Lista de așteptare — în curând"'}
          </p>
        </div>

        <button type="submit" disabled={saving}
          className="w-full bg-[#c97d4e] hover:bg-[#a85e35] text-white font-sans font-semibold py-3.5 rounded-xl transition-colors disabled:opacity-60">
          {saved ? '✓ Salvat cu succes!' : saving ? 'Se salvează...' : 'Salvează setările'}
        </button>
      </form>
    </div>
  )
}
