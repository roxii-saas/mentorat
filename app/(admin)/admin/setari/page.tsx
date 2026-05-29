'use client'

import { useEffect, useState } from 'react'

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
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => { if (data) setSettings(data) })
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const d = await res.json()
      setError(d.error || 'Eroare la salvare.')
    }
    setSaving(false)
  }

  const currencies = [
    { value: 'eur', label: 'EUR · Euro (€)' },
    { value: 'ron', label: 'RON · Leu românesc' },
    { value: 'usd', label: 'USD · Dolar ($)' },
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
        <h1 className="text-xl sm:text-2xl font-serif font-bold admin-text-primary">Setări platformă</h1>
        <p className="admin-text-muted font-sans text-sm mt-0.5">Modifică prețul și configurarea mentorat-ului</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="admin-card rounded-2xl p-5 sm:p-6">
          <h2 className="font-serif font-bold admin-text-primary mb-4 text-base sm:text-lg">💰 Preț și produs</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold admin-text-secondary mb-1.5 font-sans">Preț</label>
              <input type="number" min="1" value={settings.price_amount}
                onChange={e => setSettings(s => ({ ...s, price_amount: parseInt(e.target.value) || 0 }))}
                className="admin-input w-full rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40" />
            </div>
            <div>
              <label className="block text-sm font-semibold admin-text-secondary mb-1.5 font-sans">Monedă</label>
              <select value={settings.currency}
                onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
                className="admin-input w-full rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40">
                {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold admin-text-secondary mb-1.5 font-sans">Nume produs</label>
            <input type="text" value={settings.product_name}
              onChange={e => setSettings(s => ({ ...s, product_name: e.target.value }))}
              className="admin-input w-full rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40" />
          </div>
          <div>
            <label className="block text-sm font-semibold admin-text-secondary mb-1.5 font-sans">Descriere (apare în Stripe)</label>
            <textarea value={settings.product_description} rows={2}
              onChange={e => setSettings(s => ({ ...s, product_description: e.target.value }))}
              className="admin-input w-full rounded-xl px-4 py-3 font-sans focus:outline-none focus:ring-2 focus:ring-[#c97d4e]/40 resize-none" />
          </div>
        </div>

        <div className="admin-card rounded-2xl p-5 sm:p-6">
          <h2 className="font-serif font-bold admin-text-primary mb-1 text-base sm:text-lg">🔘 Starea vânzărilor</h2>
          <p className="text-sm admin-text-muted font-sans mb-4">Când sunt oprite, butonul devine "Lista de așteptare".</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSettings(s => ({ ...s, sales_active: !s.sales_active }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.sales_active ? 'bg-[#c97d4e]' : 'bg-gray-300 dark:bg-gray-700'}`}>
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.sales_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`font-sans font-semibold text-sm ${settings.sales_active ? 'text-green-600' : 'admin-text-muted'}`}>
              {settings.sales_active ? 'Vânzări active ✓' : 'Vânzări oprite'}
            </span>
          </div>
        </div>

        <div className="bg-[#c97d4e]/10 rounded-2xl p-4 border border-[#c97d4e]/20">
          <p className="text-xs font-sans admin-text-muted mb-1 uppercase tracking-wider font-bold">Preview buton landing</p>
          <p className="text-sm font-sans admin-text-primary">{preview}</p>
        </div>

        {error && <p className="text-red-500 text-sm font-sans bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

        <button type="submit" disabled={saving}
          className="w-full bg-gradient-to-r from-[#c97d4e] to-[#a85e35] text-white font-sans font-semibold py-3.5 rounded-xl transition-all disabled:opacity-60 shadow-lg hover:shadow-xl active:scale-95">
          {saved ? '✓ Salvat cu succes!' : saving ? 'Se salvează...' : 'Salvează setările'}
        </button>
      </form>
    </div>
  )
}
