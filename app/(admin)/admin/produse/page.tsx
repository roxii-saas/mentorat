'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/products'

const BUCKET = 'product-files'

export default function ProdusePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/admin/products')
      .then(async r => (r.ok ? r.json() : Promise.reject((await r.json()).error)))
      .then(setProducts)
      .catch(e => setError(String(e ?? 'Eroare la încărcare')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-[#ED03E9] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-4 sm:space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold db-title">Produse digitale</h1>
        <p className="db-muted font-sans text-sm mt-0.5">
          Preț, upgrade la checkout, fișierul trimis clientei și emailul personalizat. Prețul mentoratului rămâne în Setări.
        </p>
      </div>
      {error && <p className="text-red-500 text-sm font-sans bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
      {products.map(p => (
        <ProductEditor key={p.id} initial={p} onSaved={np => setProducts(ps => ps.map(x => (x.id === np.id ? np : x)))} />
      ))}
      {!products.length && !error && (
        <div className="g-card rounded-2xl p-8 text-center db-muted font-sans text-sm">Niciun produs digital încă.</div>
      )}
    </div>
  )
}

function ProductEditor({ initial, onSaved }: { initial: Product; onSaved: (p: Product) => void }) {
  const [p, setP] = useState(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP(s => ({ ...s, [k]: v }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const res = await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(p),
    })
    const d = await res.json()
    if (res.ok) {
      onSaved(d)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else setError(d.error || 'Eroare la salvare.')
    setSaving(false)
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="g-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-serif font-bold db-title text-base sm:text-lg">{p.name}</h2>
            <a href={`/${p.slug}`} target="_blank" className="text-xs font-sans text-[#ED03E9] hover:underline">/{p.slug} ↗</a>
          </div>
          <Toggle on={p.sales_active} onClick={() => set('sales_active', !p.sales_active)} labels={['Vânzări active ✓', 'Vânzări oprite']} />
        </div>
        <div className="mb-4">
          <Label>Nume produs (apare în checkout, email și Stripe)</Label>
          <input className="g-input" value={p.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <Label>Preț</Label>
            <input type="number" min="1" className="g-input" value={p.price_amount} onChange={e => set('price_amount', parseInt(e.target.value) || 0)} />
          </div>
          <div>
            <Label>Preț tăiat</Label>
            <input type="number" min="0" className="g-input" value={p.compare_price ?? ''} onChange={e => set('compare_price', e.target.value ? parseInt(e.target.value) : null)} />
          </div>
          <div>
            <Label>Monedă</Label>
            <select className="g-input" value={p.currency} onChange={e => set('currency', e.target.value)}>
              <option value="ron">RON</option><option value="eur">EUR</option>
            </select>
          </div>
        </div>
      </div>

      <div className="g-card rounded-2xl p-5 sm:p-6">
        <h3 className="font-serif font-bold db-text text-base mb-1">📎 Fișiere livrate</h3>
        <p className="text-sm db-muted font-sans mb-4">Clienta primește pe email un link permanent; fișierul rămâne privat.</p>
        <FileSlot product={p} target="main" label="Colecția principală (PDF)" onUploaded={np => { setP(np); onSaved(np) }} />
        {p.bump_active && (
          <div className="mt-3">
            <FileSlot product={p} target="bump" label="Fișier upgrade (doar pentru cine îl cumpără)" onUploaded={np => { setP(np); onSaved(np) }} />
          </div>
        )}
      </div>

      <div className="g-card rounded-2xl p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-serif font-bold db-text text-base">⬆️ Upgrade la checkout</h3>
            <p className="text-sm db-muted font-sans">Bifă opțională care se adaugă la total.</p>
          </div>
          <Toggle on={p.bump_active} onClick={() => set('bump_active', !p.bump_active)} labels={['Activ', 'Oprit']} />
        </div>
        {p.bump_active && (
          <div className="space-y-3">
            <div className="grid grid-cols-[1fr_120px] gap-3">
              <div>
                <Label>Nume upgrade</Label>
                <input className="g-input" value={p.bump_name ?? ''} onChange={e => set('bump_name', e.target.value)} />
              </div>
              <div>
                <Label>Preț</Label>
                <input type="number" min="1" className="g-input" value={p.bump_price ?? ''} onChange={e => set('bump_price', e.target.value ? parseInt(e.target.value) : null)} />
              </div>
            </div>
            <div>
              <Label>Descriere</Label>
              <textarea rows={2} className="g-input resize-none" value={p.bump_description ?? ''} onChange={e => set('bump_description', e.target.value)} />
            </div>
          </div>
        )}
      </div>

      <div className="g-card rounded-2xl p-5 sm:p-6">
        <h3 className="font-serif font-bold db-text text-base mb-1">✉️ Email trimis clientei</h3>
        <p className="text-sm db-muted font-sans mb-4">
          Scrie <code className="bg-black/5 px-1 rounded">{'{nume}'}</code> pentru prenumele clientei. Butoanele de descărcare se adaugă automat.
        </p>
        <div className="mb-3">
          <Label>Subiect</Label>
          <input className="g-input" value={p.email_subject ?? ''} onChange={e => set('email_subject', e.target.value)} />
        </div>
        <div>
          <Label>Mesaj</Label>
          <textarea rows={9} className="g-input" value={p.email_body ?? ''} onChange={e => set('email_body', e.target.value)} />
        </div>
      </div>

      {error && <p className="text-red-500 text-sm font-sans bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
      <button type="submit" disabled={saving} className="g-btn g-btn-md g-btn-full">
        {saved ? '✓ Salvat cu succes!' : saving ? 'Se salvează...' : 'Salvează produsul'}
      </button>
    </form>
  )
}

function FileSlot({ product, target, label, onUploaded }: {
  product: Product; target: 'main' | 'bump'; label: string; onUploaded: (p: Product) => void
}) {
  const [state, setState] = useState<'idle' | 'uploading' | 'error'>('idle')
  const [msg, setMsg] = useState('')
  const current = target === 'bump' ? product.bump_file_path : product.file_path

  const upload = async (file: File) => {
    // Limite Supabase (piano gratuito): 50 MB per file
    if (file.size > 50 * 1024 * 1024) {
      setState('error')
      setMsg(`Fișierul are ${(file.size / 1048576).toFixed(0)} MB — limita este 50 MB. Comprimă PDF-ul (imaginile) și reîncearcă.`)
      return
    }
    setState('uploading')
    setMsg('')
    try {
      const sign = await fetch('/api/admin/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign', id: product.id, target, filename: file.name }),
      })
      const s = await sign.json()
      if (!sign.ok) throw new Error(s.error)

      const { error } = await createClient().storage.from(BUCKET)
        .uploadToSignedUrl(s.path, s.token, file, { contentType: file.type || 'application/octet-stream' })
      if (error) throw new Error(error.message)

      const conf = await fetch('/api/admin/products', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirm', id: product.id, target, path: s.path }),
      })
      const np = await conf.json()
      if (!conf.ok) throw new Error(np.error)
      onUploaded(np)
      setState('idle')
      setMsg('✓ Încărcat')
    } catch (e) {
      setState('error')
      setMsg(e instanceof Error ? e.message : 'Eroare la încărcare')
    }
  }

  return (
    <div className="rounded-xl border border-black/[.08] p-3.5 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold db-text font-sans">{label}</p>
        <p className={`text-xs font-sans truncate ${current ? 'db-muted' : 'text-amber-600 font-semibold'}`}>
          {current ? current.split('/').pop() : '⚠️ Niciun fișier — clientele nu vor primi nimic!'}
        </p>
        {msg && <p className={`text-xs font-sans mt-0.5 ${state === 'error' ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
      </div>
      <label className={`g-btn g-btn-md cursor-pointer text-center ${state === 'uploading' ? 'opacity-60 pointer-events-none' : ''}`}>
        {state === 'uploading' ? 'Se încarcă…' : current ? 'Înlocuiește' : 'Încarcă fișier'}
        <input type="file" accept=".pdf,.zip,.epub,.mp4,.mov" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
      </label>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold db-text2 mb-1.5 font-sans">{children}</label>
}

function Toggle({ on, onClick, labels }: { on: boolean; onClick: () => void; labels: [string, string] }) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className={`font-sans font-semibold text-xs ${on ? 'text-green-600' : 'db-muted'}`}>{on ? labels[0] : labels[1]}</span>
      <button type="button" onClick={onClick}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${on ? 'bg-[#ED03E9]' : 'bg-gray-300'}`}>
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
