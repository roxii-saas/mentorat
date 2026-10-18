'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Product } from '@/lib/products'
import BarChart from '@/components/admin/BarChart'
import { buildBuckets, daysBetween, indexDaily, money, nf, sumBuckets, type DailyRow } from '@/lib/admin-analytics'
import SetariPage from '@/app/(admin)/admin/setari/page'
import HomepagePage from '@/app/(admin)/admin/homepage/page'

const BUCKET = 'product-files'

export type Tab = 'previzualizare' | 'analiza' | 'detalii' | 'upgrade' | 'livrare' | 'landing'
export type OrderLite = { id: string; name: string | null; email: string; amount: number | null; currency: string; created_at: string; bump_included: boolean }

const TABS_DIGITAL: { key: Tab; label: string }[] = [
  { key: 'previzualizare', label: 'Previzualizare' }, { key: 'analiza', label: 'Analiză' },
  { key: 'detalii', label: 'Detalii și preț' }, { key: 'upgrade', label: 'Upgrade' }, { key: 'livrare', label: 'Livrare (fișiere + email)' },
]
const TABS_MENTORAT: { key: Tab; label: string }[] = [
  { key: 'previzualizare', label: 'Previzualizare' }, { key: 'analiza', label: 'Analiză' },
  { key: 'detalii', label: 'Preț și detalii' }, { key: 'landing', label: 'Conținut pagină' },
]

// Pagina publică a produsului: mentoratul e pe prima pagină, restul pe /<slug>
export const landingPath = (p: Pick<Product, 'slug' | 'kind'>) => (p.kind === 'mentorat' ? '/' : `/${p.slug}`)
const checkoutPath = (p: Pick<Product, 'slug' | 'kind'>) => (p.kind === 'mentorat' ? '/checkout' : `/${p.slug}/checkout`)
const shortName = (p: Pick<Product, 'slug'>) => p.slug.charAt(0).toUpperCase() + p.slug.slice(1)
const fmtPrice = (p: Pick<Product, 'price_amount' | 'currency'>) => money(p.price_amount, p.currency)

// Alegi produsul (slug-ul se vede peste tot), apoi lucrezi doar pe el: previzualizare, analiză, preț, upgrade, livrare.
export default function ProductWorkspace({ products, activeSlug, initialTab, daily, today, orders }: {
  products: Product[]; activeSlug: string; initialTab: Tab
  daily: DailyRow[]; today: string; orders: OrderLite[]
}) {
  const [list, setList] = useState(products)
  const product = list.find(p => p.slug === activeSlug) ?? list[0]
  const tabs = product?.kind === 'mentorat' ? TABS_MENTORAT : TABS_DIGITAL
  const [tab, setTabState] = useState<Tab>(tabs.some(t => t.key === initialTab) ? initialTab : 'previzualizare')
  const [version, setVersion] = useState(0)
  const setTab = (t: Tab) => {
    setTabState(t)
    try { const u = new URL(window.location.href); u.searchParams.set('t', t); window.history.replaceState(null, '', u) } catch {}
  }
  if (!product) return <div className="g-card rounded-2xl p-8 text-center db-muted font-sans text-sm">Niciun produs încă.</div>
  const href = (slug: string) => `/admin/produse?p=${slug}&t=${tab}`

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold db-title">Produse</h1>
        <p className="db-muted font-sans text-sm mt-0.5">Alege produsul, apoi vezi pagina lui, analizează vânzările și modifică-l. Fiecare produs are secțiunea lui.</p>
      </div>

      <nav aria-label="Alege produsul" className="grid grid-cols-1 sm:grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-3">
        {list.map(p => {
          const on = p.id === product.id
          return (
            <Link key={p.id} href={href(p.slug)} scroll={false} aria-current={on ? 'page' : undefined}
              className={`g-card block px-4 py-3.5 transition-colors ${on ? '!border-[#B800BA] ring-1 ring-[#B800BA]' : 'hover:bg-[#FAFAFD]'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[15px] font-bold ${on ? 'text-[#8A008D]' : 'text-[#15151C]'}`}>{shortName(p)}</span>
                <span className={`text-xs font-semibold ${p.sales_active ? 'text-[#0B6B49]' : 'text-[#8A5300]'}`}>{p.sales_active ? '● Vânzări active' : '● Oprite'}</span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-[13px] text-[#5A5A6C]">
                <code className="bg-[#F1F1F6] rounded px-1.5 py-0.5 text-[#2B2B38]">{landingPath(p)}</code>
                <span>{p.kind === 'mentorat' ? 'Mentorat' : 'Produs digital'} · {fmtPrice(p)}</span>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Banda care spune clar ce produs editezi */}
      <div className="rounded-[12px] border border-[#E6C2E8] bg-[#FBF0FB] px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-[#5A0A5C]">Lucrezi pe: <strong className="text-[15px]">{product.name}</strong>
          {' '}<code className="ml-1 bg-white border border-[#E6C2E8] rounded px-1.5 py-0.5 text-[#8A008D]">slug: {product.slug}</code></p>
        <a href={landingPath(product)} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#8A008D] hover:underline">Deschide pagina {landingPath(product)} ↗</a>
      </div>

      <div role="tablist" aria-label={`Secțiuni ${shortName(product)}`} className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)}
            className={`px-4 h-10 rounded-[10px] text-sm font-semibold border whitespace-nowrap ${tab === t.key ? 'bg-[#15151C] text-white border-[#15151C]' : 'bg-white text-[#2B2B38] border-[#D3D3DF] hover:bg-[#F6F6FA]'}`}>{t.label}</button>
        ))}
      </div>

      <div key={product.id}>
        {tab === 'previzualizare' && <Preview product={product} version={version} />}
        {tab === 'analiza' && <Analysis product={product} daily={daily} today={today} orders={orders} />}
        {product.kind === 'mentorat' ? (
          <>
            {tab === 'detalii' && <SetariPage />}
            {tab === 'landing' && <HomepagePage />}
          </>
        ) : (
          <div className="max-w-3xl" hidden={!(tab === 'detalii' || tab === 'upgrade' || tab === 'livrare')}>
            <ProductForm initial={product} tab={tab} onSaved={np => { setList(ps => ps.map(x => (x.id === np.id ? np : x))); setVersion(v => v + 1) }} />
          </div>
        )}
      </div>
    </div>
  )
}

function Preview({ product, version }: { product: Product; version: number }) {
  const [mode, setMode] = useState<'desktop' | 'mobile'>('desktop')
  const [n, setN] = useState(0)
  const src = landingPath(product)
  return (
    <div className="g-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <h2 className="text-base font-semibold text-[#15151C]">Așa o văd clienții: <code className="text-[#8A008D]">{src}</code></h2>
          <p className="text-xs db-muted">Previzualizarea nu intră în statistici. După ce salvezi o modificare, se reîncarcă singură.</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(['desktop', 'mobile'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
              className={`px-3.5 h-9 rounded-[10px] text-sm font-semibold border ${mode === m ? 'bg-[#15151C] text-white border-[#15151C]' : 'bg-white text-[#2B2B38] border-[#D3D3DF]'}`}>{m === 'desktop' ? 'Calculator' : 'Telefon'}</button>
          ))}
          <button onClick={() => setN(x => x + 1)} className="px-3.5 h-9 rounded-[10px] text-sm font-semibold border bg-white text-[#2B2B38] border-[#D3D3DF]">↻ Reîncarcă</button>
          <a href={checkoutPath(product)} target="_blank" rel="noreferrer" className="px-3.5 h-9 inline-flex items-center rounded-[10px] text-sm font-semibold border bg-white text-[#2B2B38] border-[#D3D3DF]">Checkout ↗</a>
        </div>
      </div>
      <div className="rounded-[10px] bg-[#EEEEF4] p-2 sm:p-3 flex justify-center">
        <iframe key={`${version}-${n}-${mode}`} src={src} title={`Previzualizare ${product.name}`}
          className="bg-white rounded-[8px] border border-[#D3D3DF] max-w-full" style={{ width: mode === 'mobile' ? 390 : '100%', height: 760 }} />
      </div>
    </div>
  )
}

function Analysis({ product, daily, today, orders }: { product: Product; daily: DailyRow[]; today: string; orders: OrderLite[] }) {
  const idx = indexDaily(daily, product.id)
  const days90 = daysBetween(addDaysLocal(today, -89), today)
  const b90 = buildBuckets(days90, 'day', idx)
  const b30 = b90.slice(-30)
  const t30 = sumBuckets(b30), t90 = sumBuckets(b90)
  const rev = (t: typeof t30) => Object.entries(t.cur).filter(([, v]) => v.revenue > 0).map(([c, v]) => money(v.revenue, c)).join(' + ') || '0'
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {([['Vânzări (30 zile)', nf(t30.sales)], ['Încasări (30 zile)', rev(t30)], ['Vânzări (90 zile)', nf(t90.sales)], ['Încasări (90 zile)', rev(t90)]] as [string, string][]).map(([l, v]) => (
          <div key={l} className="g-card p-4"><p className="text-[24px] leading-8 font-bold tnum text-[#15151C]">{v}</p><p className="text-sm font-medium db-muted">{l}</p></div>
        ))}
      </div>
      <div className="g-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-[#15151C] mb-3">Vânzări pe zi — ultimele 30 de zile</h2>
        <BarChart ariaLabel={`Vânzări zilnice ${product.slug}`} color="#B800BA"
          bars={b30.map((b, i) => ({ value: b.agg.sales, tip: `${b.long}: ${b.agg.sales} vânzări`, label: b.label, showLabel: i % 5 === 0 }))} />
        <p className="text-xs db-muted mt-3">Vizitatorii și drumul lor spre cumpărare sunt în <Link href="/admin/live" className="underline">Live</Link>; analiza completă pe perioade, în <Link href="/admin" className="underline">Overview</Link>.</p>
      </div>
      <div className="g-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-[#15151C] mb-3">Ultimele comenzi</h2>
        {orders.length === 0 ? <p className="text-sm db-muted">Nicio comandă încă.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs font-semibold db-muted"><th className="pb-2">Client</th><th className="pb-2">Data</th><th className="pb-2 text-right">Sumă</th></tr></thead>
            <tbody>{orders.map(o => (
              <tr key={o.id} className="border-t border-[#EEEEF4]">
                <td className="py-2 pr-3">{o.name || o.email}{o.bump_included ? <span className="ml-2 text-xs font-semibold text-[#0B6B49]">+ upgrade</span> : null}</td>
                <td className="py-2 pr-3 tnum whitespace-nowrap">{new Date(o.created_at).toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'short', timeStyle: 'short' })}</td>
                <td className="py-2 text-right tnum whitespace-nowrap">{o.amount != null ? money(o.amount, o.currency) : '—'}</td>
              </tr>))}</tbody>
          </table>
        )}
      </div>
    </div>
  )
}

function addDaysLocal(iso: string, n: number) { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }


function ProductForm({ initial, tab, onSaved }: { initial: Product; tab: Tab; onSaved: (p: Product) => void }) {
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
      setP(d)
      onSaved(d)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else setError(d.error || 'Eroare la salvare.')
    setSaving(false)
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <div className="g-card rounded-2xl p-5 sm:p-6" hidden={tab !== 'detalii'}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h2 className="font-bold db-title text-base sm:text-lg">Detalii și preț</h2>
            <p className="text-sm db-muted font-sans">Ce se modifică aici se schimbă pe pagina <strong>/{p.slug}</strong>, în checkout, în email și în Stripe.</p>
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

      <div className="g-card rounded-2xl p-5 sm:p-6" hidden={tab !== 'livrare'}>
        <h3 className="font-bold db-text text-base mb-1">Fișiere livrate</h3>
        <p className="text-sm db-muted font-sans mb-4">Clienta primește pe email un link permanent; fișierul rămâne privat.</p>
        <FileSlot product={p} target="main" label="Colecția principală (PDF)" onUploaded={np => { setP(np); onSaved(np) }} />
        {p.bump_active && (
          <div className="mt-3">
            <FileSlot product={p} target="bump" label="Fișier upgrade (doar pentru cine îl cumpără)" onUploaded={np => { setP(np); onSaved(np) }} />
          </div>
        )}
      </div>

      <div className="g-card rounded-2xl p-5 sm:p-6" hidden={tab !== 'upgrade'}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold db-text text-base">Upgrade la checkout</h3>
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

      <div className="g-card rounded-2xl p-5 sm:p-6" hidden={tab !== 'livrare'}>
        <h3 className="font-bold db-text text-base mb-1">Email trimis clientei</h3>
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

      {error && <p className="text-[#B42318] text-sm font-sans bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
      <button type="submit" disabled={saving} className="g-btn g-btn-md g-btn-full">
        {saved ? '✓ Salvat cu succes!' : saving ? 'Se salvează...' : `Salvează „${shortName(p)}”`}
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
        <p className={`text-xs font-sans truncate ${current ? 'db-muted' : 'text-[#8A5300] font-semibold'}`}>
          {current ? current.split('/').pop() : 'Niciun fișier — clientele nu vor primi nimic!'}
        </p>
        {msg && <p className={`text-xs font-sans mt-0.5 ${state === 'error' ? 'text-[#B42318]' : 'text-[#0B6B49]'}`}>{msg}</p>}
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
      <span className={`font-sans font-semibold text-xs ${on ? 'text-[#0B6B49]' : 'db-muted'}`}>{on ? labels[0] : labels[1]}</span>
      <button type="button" role="switch" aria-checked={on} onClick={onClick}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${on ? 'bg-[#B800BA]' : 'bg-[#8A8AA0]'}`}>
        <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  )
}
