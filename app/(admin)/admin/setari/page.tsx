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
      <div className="w-8 h-8 border-2 border-[#ED03E9] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold db-title">Setări platformă</h1>
        <p className="db-muted font-sans text-sm mt-0.5">Modifică prețul și configurarea mentorat-ului</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="g-card rounded-2xl p-5 sm:p-6">
          <h2 className="font-serif font-bold db-title mb-4 text-base sm:text-lg flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ED03E9" strokeWidth="2" className="w-5 h-5"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8V7m0 1v8m0 0v1m0-1" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="10"/></svg>
            Preț și produs
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold db-text2 mb-1.5 font-sans">Preț</label>
              <input type="number" min="1" value={settings.price_amount}
                onChange={e => setSettings(s => ({ ...s, price_amount: parseInt(e.target.value) || 0 }))}
                className="g-input" />
            </div>
            <div>
              <label className="block text-sm font-semibold db-text2 mb-1.5 font-sans">Monedă</label>
              <select value={settings.currency}
                onChange={e => setSettings(s => ({ ...s, currency: e.target.value }))}
                className="g-input">
                {currencies.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-sm font-semibold db-text2 mb-1.5 font-sans">Nume produs</label>
            <input type="text" value={settings.product_name}
              onChange={e => setSettings(s => ({ ...s, product_name: e.target.value }))}
              className="g-input" />
          </div>
          <div>
            <label className="block text-sm font-semibold db-text2 mb-1.5 font-sans">Descriere (apare în Stripe)</label>
            <textarea value={settings.product_description} rows={2}
              onChange={e => setSettings(s => ({ ...s, product_description: e.target.value }))}
              className="g-input resize-none" />
          </div>
        </div>

        <div className="g-card rounded-2xl p-5 sm:p-6">
          <h2 className="font-serif font-bold db-text mb-1 text-base sm:text-lg">🔘 Starea vânzărilor</h2>
          <p className="text-sm db-muted font-sans mb-4">Când sunt oprite, butonul devine "Lista de așteptare".</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSettings(s => ({ ...s, sales_active: !s.sales_active }))}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${settings.sales_active ? 'bg-[#ED03E9]' : 'bg-gray-300'}`}>
              <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.sales_active ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
            <span className={`font-sans font-semibold text-sm ${settings.sales_active ? 'text-green-600' : 'db-muted'}`}>
              {settings.sales_active ? 'Vânzări active ✓' : 'Vânzări oprite'}
            </span>
          </div>
        </div>

        <div className="bg-[#ED03E9]/10 rounded-2xl p-4 border border-[#ED03E9]/20">
          <p className="text-xs font-sans db-muted mb-1 uppercase tracking-wider font-bold">Preview buton landing</p>
          <p className="text-sm font-sans db-text">{preview}</p>
        </div>

        {error && <p className="text-red-500 text-sm font-sans bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

        <button type="submit" disabled={saving}
          className="g-btn g-btn-md g-btn-full">
          {saved ? '✓ Salvat cu succes!' : saving ? 'Se salvează...' : 'Salvează setările'}
        </button>
      </form>
    </div>
  )
}
