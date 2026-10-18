'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { slugError, slugify } from '@/lib/product-slug'
import { createClient } from '@/lib/supabase/client'
import type { Landing, Product } from '@/lib/products'
import BarChart from '@/components/admin/BarChart'
import { applyCode, bucharestInputToIso, codeLabel, codeProblem, currentPrice, formatBucharest, isoToBucharestInput, promoPrice, promoState, type CodeFields } from '@/lib/pricing'
import { buildBuckets, daysBetween, indexDaily, money, nf, sumBuckets, type DailyRow } from '@/lib/admin-analytics'
import SetariPage from '@/app/(admin)/admin/setari/page'
import HomepagePage from '@/app/(admin)/admin/homepage/page'

const BUCKET = 'product-files'

export type Tab = 'previzualizare' | 'analiza' | 'detalii' | 'preturi' | 'upgrade' | 'livrare' | 'landing'
export type OrderLite = { id: string; name: string | null; email: string; amount: number | null; currency: string; created_at: string; bump_included: boolean }

const TABS_DIGITAL: { key: Tab; label: string }[] = [
  { key: 'previzualizare', label: 'Previzualizare' }, { key: 'landing', label: 'Conținut pagină' }, { key: 'analiza', label: 'Analiză' },
  { key: 'detalii', label: 'Detalii și preț' }, { key: 'preturi', label: 'Promoții și coduri' }, { key: 'upgrade', label: 'Upgrade' }, { key: 'livrare', label: 'Livrare (fișiere + email)' },
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
// Lista produselor: doar alegi produsul (sau creezi unul nou); modificarea se face în pagina lui
export function ProductList({ products, daily, today }: { products: Product[]; daily: DailyRow[]; today: string }) {
  const days30 = daysBetween(addDaysLocal(today, -29), today)
  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold db-title">Produse</h1>
        <p className="db-muted font-sans text-sm mt-0.5">Alege produsul pe care vrei să îl vezi sau să îl modifici. Fiecare produs are pagina lui de administrare.</p>
      </div>
      <div className="grid items-start grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {products.map(p => {
          const t = sumBuckets(buildBuckets(days30, 'day', indexDaily(daily, p.id)))
          return (
            <Link key={p.id} href={`/admin/produse/${p.slug}`} className="g-card block p-4 sm:p-5 hover:bg-[#FAFAFD] transition-colors">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-[16px] leading-snug font-bold text-[#15151C]">{shortName(p)}</h2>
                <span className={`text-xs font-semibold whitespace-nowrap ${p.sales_active ? 'text-[#0B6B49]' : 'text-[#8A5300]'}`}>{p.sales_active ? '● Vânzări active' : '● Oprite'}</span>
              </div>
              <p className="text-sm db-muted mt-1 line-clamp-2">{p.name}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-[#5A5A6C]">
                <code className="bg-[#F1F1F6] rounded px-1.5 py-0.5 text-[#2B2B38]">{landingPath(p)}</code>
                <span>{p.kind === 'mentorat' ? 'Mentorat' : 'Produs digital'} · {fmtPrice(p)}</span>
              </div>
              <p className="mt-3 text-sm text-[#2B2B38]"><strong className="tnum">{nf(t.sales)}</strong> vânzări în ultimele 30 de zile</p>
              <p className="mt-3 text-sm font-semibold text-[#8A008D]">Deschide și modifică →</p>
            </Link>
          )
        })}
        <NewProduct />
      </div>
    </div>
  )
}

// Pagina unui produs: previzualizare, analiză și modificare — doar pentru produsul ales
export default function ProductWorkspace({ product: initial, initialTab, daily, today, orders }: {
  product: Product; initialTab: Tab
  daily: DailyRow[]; today: string; orders: OrderLite[]
}) {
  const [product, setProduct] = useState(initial)
  const tabs = product.kind === 'mentorat' ? TABS_MENTORAT : TABS_DIGITAL
  const [tab, setTabState] = useState<Tab>(tabs.some(t => t.key === initialTab) ? initialTab : 'previzualizare')
  const [version, setVersion] = useState(0)
  const setTab = (t: Tab) => {
    setTabState(t)
    try { const u = new URL(window.location.href); u.searchParams.set('t', t); window.history.replaceState(null, '', u) } catch {}
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div>
        <Link href="/admin/produse" className="text-sm font-semibold text-[#8A008D] hover:underline">← Toate produsele</Link>
        <h1 className="text-xl sm:text-2xl font-bold db-title mt-1">{shortName(product)}</h1>
        <p className="db-muted font-sans text-sm mt-0.5">Vezi pagina, analizează vânzările și modifică acest produs.</p>
      </div>

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
          <div className="max-w-3xl" hidden={!(tab === 'detalii' || tab === 'preturi' || tab === 'upgrade' || tab === 'livrare' || tab === 'landing')}>
            <ProductForm initial={product} tab={tab} onSaved={np => { setProduct(np); setVersion(v => v + 1) }} />
            {tab === 'preturi' && <DiscountCodes product={product} />}
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
      <div hidden={tab !== 'landing'}>
        <LandingEditor p={p} patch={x => setP(s => ({ ...s, ...x }))} />
      </div>

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

      <div className="g-card rounded-2xl p-5 sm:p-6" hidden={tab !== 'preturi'}>
        <PromoEditor p={p} patch={x => setP(s => ({ ...s, ...x }))} />
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


// ───────── Produs nou: numele + prețul → pagina lui există imediat pe /<slug> ─────────
function NewProduct() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [touched, setTouched] = useState(false)
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('ron')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const slugErr = slug ? slugError(slug) : null

  const create = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const r = await fetch('/api/admin/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', name, slug, price_amount: Number(price), currency }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setError(d.error || 'Nu s-a putut crea produsul.'); setBusy(false); return }
    router.push(`/admin/produse/${d.slug}?t=landing`)
    router.refresh()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} className="g-card p-5 text-left border-dashed hover:bg-[#FAFAFD] flex items-center gap-2 text-[15px] font-bold text-[#8A008D] min-h-[120px]">
      <span aria-hidden className="text-xl leading-none">＋</span> Produs nou
    </button>
  )
  return (
    <form onSubmit={create} className="g-card p-4 space-y-3 sm:col-span-2 lg:col-span-3">
      <h2 className="font-bold db-text text-base">Produs digital nou</h2>
      <div>
        <Label>Nume produs</Label>
        <input className="g-input" value={name} required placeholder="ex: Ghid Social Media"
          onChange={e => { setName(e.target.value); if (!touched) setSlug(slugify(e.target.value)) }} />
      </div>
      <div>
        <Label>Slug — adresa paginii lui</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm db-muted whitespace-nowrap">mentorat.roxii-dinca.com/</span>
          <input className="g-input" value={slug} required onChange={e => { setTouched(true); setSlug(e.target.value.toLowerCase()) }} />
        </div>
        {slugErr && <p className="text-xs text-[#B42318] mt-1">{slugErr}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Preț</Label><input type="number" min="1" required className="g-input" value={price} onChange={e => setPrice(e.target.value)} /></div>
        <div><Label>Monedă</Label>
          <select className="g-input" value={currency} onChange={e => setCurrency(e.target.value)}><option value="ron">RON</option><option value="eur">EUR</option></select></div>
      </div>
      <p className="text-xs db-muted">Produsul pornește cu vânzările oprite. Completezi pagina, încarci fișierul, apoi activezi vânzările.</p>
      {error && <p className="text-[#B42318] text-sm bg-red-50 px-3 py-2 rounded-xl" role="alert">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy || !!slugErr || !slug} className="g-btn g-btn-md">{busy ? 'Se creează…' : 'Creează produsul'}</button>
        <button type="button" onClick={() => setOpen(false)} className="g-btn g-btn-md !bg-white !text-[#2B2B38] border border-[#D3D3DF]">Renunță</button>
      </div>
    </form>
  )
}

// ───────── Conținutul paginii dedicate ─────────
function LandingEditor({ p, patch }: { p: Product; patch: (x: Partial<Product>) => void }) {
  const L: Landing = p.landing ?? {}
  const setL = (x: Partial<Landing>) => patch({ landing: { ...L, ...x } })
  const [upErr, setUpErr] = useState('')
  const [uploading, setUploading] = useState(false)

  if (p.slug === 'prompturi') {
    return (
      <div className="g-card rounded-2xl p-5 sm:p-6">
        <h2 className="font-bold db-title text-base sm:text-lg">Pagina Prompturi</h2>
        <p className="text-sm db-muted mt-1">Această pagină are un design special (rezultate înainte/după, module, comparație) și conținutul ei este în cod. Prețul, upgrade-ul, fișierele și emailul se modifică din celelalte secțiuni. Produsele noi folosesc un șablon pe care îl completezi chiar aici.</p>
      </div>
    )
  }

  const upload = async (file: File) => {
    setUploading(true); setUpErr('')
    try {
      const fd = new FormData(); fd.append('file', file)
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      patch({ cover_url: d.url })
    } catch (e) { setUpErr(e instanceof Error ? e.message : 'Eroare la încărcare') }
    setUploading(false)
  }
  const benefits = L.benefits ?? [], faq = L.faq ?? []

  return (
    <div className="space-y-4">
      <div className="g-card rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="font-bold db-title text-base sm:text-lg">Început de pagină</h2>
        <p className="text-sm db-muted">Ce văd clienții când deschid <strong>/{p.slug}</strong>. Ce lași gol primește o valoare implicită.</p>
        <div><Label>Mesaj mic deasupra titlului</Label><input className="g-input" value={L.eyebrow ?? ''} placeholder="Produs digital" onChange={e => setL({ eyebrow: e.target.value })} /></div>
        <div><Label>Titlu principal</Label><input className="g-input" value={L.headline ?? ''} placeholder={p.name} onChange={e => setL({ headline: e.target.value })} /></div>
        <div><Label>Descriere scurtă</Label><textarea rows={2} className="g-input" value={L.subheadline ?? ''} onChange={e => setL({ subheadline: e.target.value })} /></div>
        <div><Label>Etichetă pe copertă (opțional)</Label><input className="g-input" value={L.badge ?? ''} placeholder="ex: Best seller" onChange={e => setL({ badge: e.target.value })} /></div>
        <div>
          <Label>Imagine / copertă (pătrată)</Label>
          <div className="flex items-center gap-3">
            {p.cover_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.cover_url} alt="Coperta curentă" className="w-20 h-20 rounded-lg object-cover border border-[#D3D3DF]" />
            )}
            <label className={`g-btn g-btn-md cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              {uploading ? 'Se încarcă…' : p.cover_url ? 'Schimbă imaginea' : 'Încarcă imagine'}
              <input type="file" accept=".jpg,.jpeg,.png,.webp,.avif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = '' }} />
            </label>
            {p.cover_url && <button type="button" className="text-sm underline db-muted" onClick={() => patch({ cover_url: null })}>Șterge</button>}
          </div>
          {upErr && <p className="text-xs text-[#B42318] mt-1">{upErr}</p>}
        </div>
      </div>

      <div className="g-card rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="font-bold db-title text-base sm:text-lg">Beneficii („Ce primești”)</h2>
        {benefits.map((b, i) => (
          <div key={i} className="rounded-xl border border-black/[.08] p-3 space-y-2">
            <input className="g-input" aria-label={`Titlu beneficiu ${i + 1}`} placeholder="Titlu" value={b.title} onChange={e => setL({ benefits: benefits.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
            <textarea rows={2} className="g-input" aria-label={`Text beneficiu ${i + 1}`} placeholder="Explicație scurtă" value={b.text} onChange={e => setL({ benefits: benefits.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
            <button type="button" className="text-sm underline text-[#B42318]" onClick={() => setL({ benefits: benefits.filter((_, j) => j !== i) })}>Șterge</button>
          </div>
        ))}
        <button type="button" className="g-btn g-btn-md !bg-white !text-[#2B2B38] border border-[#D3D3DF]" onClick={() => setL({ benefits: [...benefits, { title: '', text: '' }] })}>＋ Adaugă beneficiu</button>
      </div>

      <div className="g-card rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="font-bold db-title text-base sm:text-lg">Ce conține</h2>
        <Label>Un rând = un punct din listă</Label>
        <textarea rows={6} className="g-input" value={(L.inside ?? []).join('\n')} onChange={e => setL({ inside: e.target.value.split('\n') })} />
      </div>

      <div className="g-card rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="font-bold db-title text-base sm:text-lg">Întrebări frecvente</h2>
        {faq.map((f, i) => (
          <div key={i} className="rounded-xl border border-black/[.08] p-3 space-y-2">
            <input className="g-input" aria-label={`Întrebarea ${i + 1}`} placeholder="Întrebare" value={f.q} onChange={e => setL({ faq: faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} />
            <textarea rows={2} className="g-input" aria-label={`Răspunsul ${i + 1}`} placeholder="Răspuns" value={f.a} onChange={e => setL({ faq: faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} />
            <button type="button" className="text-sm underline text-[#B42318]" onClick={() => setL({ faq: faq.filter((_, j) => j !== i) })}>Șterge</button>
          </div>
        ))}
        <button type="button" className="g-btn g-btn-md !bg-white !text-[#2B2B38] border border-[#D3D3DF]" onClick={() => setL({ faq: [...faq, { q: '', a: '' }] })}>＋ Adaugă întrebare</button>
      </div>

      <div className="g-card rounded-2xl p-5 sm:p-6 space-y-3">
        <h2 className="font-bold db-title text-base sm:text-lg">Final de pagină și checkout</h2>
        <div><Label>Titlu apel final</Label><input className="g-input" value={L.cta_title ?? ''} placeholder="Începe chiar azi" onChange={e => setL({ cta_title: e.target.value })} /></div>
        <div><Label>Text apel final</Label><input className="g-input" value={L.cta_text ?? ''} placeholder="Acces imediat după plată, direct pe email." onChange={e => setL({ cta_text: e.target.value })} /></div>
        <div><Label>Garanție</Label><textarea rows={2} className="g-input" value={L.guarantee ?? ''} placeholder="Dacă nu ești mulțumit(ă), scrie-ne în termen de 14 zile și primești toți banii înapoi, fără întrebări." onChange={e => setL({ guarantee: e.target.value })} /></div>
        <div><Label>Text sub „Finalizează comanda”</Label><input className="g-input" value={L.checkout_text ?? ''} placeholder="Primești produsul pe email imediat după plată." onChange={e => setL({ checkout_text: e.target.value })} /></div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div><Label>Format (în checkout)</Label><input className="g-input" value={L.format ?? ''} placeholder="PDF digital" onChange={e => setL({ format: e.target.value })} /></div>
          <div><Label>Notă în checkout (opțional)</Label><input className="g-input" value={L.checkout_note ?? ''} placeholder="ex: Include 2 bonusuri" onChange={e => setL({ checkout_note: e.target.value })} /></div>
        </div>
      </div>
    </div>
  )
}


// ───────── Promoție programată: prețul se schimbă singur la început și revine singur la sfârșit ─────────
function PromoEditor({ p, patch }: { p: Product; patch: (x: Partial<Product>) => void }) {
  const mode = p.promo_type ?? ''
  const state = promoState(p)
  const cur = currentPrice(p)
  const resulting = p.promo_type && p.promo_value ? promoPrice(p) : null
  const STATE_TEXT = { none: '', scheduled: 'Programată: nu a început încă', active: 'Activă acum: clienții văd prețul redus', ended: 'Încheiată: se vede din nou prețul normal' } as const

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-bold db-title text-base sm:text-lg">Promoție programată</h2>
        <p className="text-sm db-muted">Alegi prețul sau reducerea și între ce zile și ore e valabilă. Se pornește și se oprește singură; nu mai trebuie să schimbi prețul de mână. Orele sunt ora României.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <Label>Tip</Label>
          <select className="g-input" value={mode} onChange={e => {
            const v = e.target.value as '' | 'price' | 'percent'
            patch(v ? { promo_type: v, promo_value: p.promo_value ?? (v === 'percent' ? 20 : Math.max(1, Math.round(p.price_amount * 0.8))) } : { promo_type: null, promo_value: null, promo_starts_at: null, promo_ends_at: null })
          }}>
            <option value="">Fără promoție</option>
            <option value="price">Duc prețul la o sumă fixă</option>
            <option value="percent">Aplic o reducere în procente</option>
          </select>
        </div>
        {mode && (
          <div>
            <Label>{mode === 'price' ? `Noul preț (${p.currency.toUpperCase()})` : 'Reducere (%)'}</Label>
            <input type="number" min="1" max={mode === 'percent' ? 99 : undefined} className="g-input" value={p.promo_value ?? ''}
              onChange={e => patch({ promo_value: e.target.value ? parseInt(e.target.value) : null })} />
          </div>
        )}
      </div>
      {mode && (
        <>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label>Începe (zi și oră)</Label>
              <input type="datetime-local" className="g-input" value={isoToBucharestInput(p.promo_starts_at)}
                onChange={e => patch({ promo_starts_at: e.target.value ? bucharestInputToIso(e.target.value) : null })} />
              <p className="text-xs db-muted mt-1">Gol = de acum.</p>
            </div>
            <div>
              <Label>Se termină (zi și oră)</Label>
              <input type="datetime-local" className="g-input" value={isoToBucharestInput(p.promo_ends_at)}
                onChange={e => patch({ promo_ends_at: e.target.value ? bucharestInputToIso(e.target.value) : null })} />
              <p className="text-xs db-muted mt-1">Gol = fără sfârșit, până o oprești tu.</p>
            </div>
          </div>
          <div className="rounded-xl bg-[#F6F6FA] px-4 py-3 text-sm space-y-0.5" role="status">
            <p>Preț normal: <strong>{money(p.price_amount, p.currency)}</strong> → în promoție: <strong>{resulting ? money(resulting, p.currency) : '—'}</strong></p>
            <p className="db-muted">{STATE_TEXT[state]}{state === 'active' ? ` · acum se vinde cu ${money(cur.price, p.currency)}` : ''}</p>
            <p className="db-muted">{p.promo_starts_at ? `De la ${formatBucharest(p.promo_starts_at)}` : 'De acum'}{p.promo_ends_at ? ` până la ${formatBucharest(p.promo_ends_at)}` : ', fără dată de final'} (ora României)</p>
          </div>
        </>
      )}
      <p className="text-xs db-muted">Apasă „Salvează” de mai jos ca să aplici promoția. Pagina de vânzare arată prețul vechi tăiat și, dacă există dată de final, „Ofertă valabilă până la…”.</p>
    </div>
  )
}

// ───────── Coduri de reducere ─────────
type CodeRow = CodeFields & { id: string; code: string; product_id: string }

function DiscountCodes({ product }: { product: Product }) {
  const [codes, setCodes] = useState<CodeRow[] | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const emptyForm = { code: '', type: 'percent' as CodeFields['type'], value: '10', starts: '', ends: '', max: '' }
  const [f, setF] = useState(emptyForm)
  const [editing, setEditing] = useState<CodeRow | null>(null)

  useEffect(() => {
    let dead = false
    fetch(`/api/admin/discount-codes?product_id=${product.id}`).then(async r => {
      const d = await r.json()
      if (dead) return
      if (!r.ok) { setError(d.error ?? 'Nu pot încărca codurile.'); setCodes([]) } else setCodes(d)
    }).catch(() => { if (!dead) { setError('Nu pot încărca codurile.'); setCodes([]) } })
    return () => { dead = true }
  }, [product.id])

  const gen = () => setF(x => ({ ...x, code: Array.from({ length: 8 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('') }))

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setError('')
    const payload = {
      code: f.code.trim(), type: f.type, value: Number(f.value),
      starts_at: f.starts ? bucharestInputToIso(f.starts) : null, ends_at: f.ends ? bucharestInputToIso(f.ends) : null,
      max_uses: f.max ? Number(f.max) : null,
    }
    const r = await fetch('/api/admin/discount-codes', {
      method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { id: editing.id, ...payload } : { product_id: product.id, ...payload }),
    })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) setError(d.error ?? 'Nu s-a putut salva codul.')
    else {
      setCodes(c => (editing ? (c ?? []).map(x => (x.id === d.id ? d : x)) : [d, ...(c ?? [])]))
      setEditing(null); setF(emptyForm)
    }
    setBusy(false)
  }
  const edit = (c: CodeRow) => {
    setEditing(c); setError('')
    setF({ code: c.code, type: c.type, value: String(c.value), starts: isoToBucharestInput(c.starts_at), ends: isoToBucharestInput(c.ends_at), max: c.max_uses != null ? String(c.max_uses) : '' })
    document.getElementById('code-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const cancelEdit = () => { setEditing(null); setF(emptyForm); setError('') }
  const toggle = async (c: CodeRow) => {
    const r = await fetch('/api/admin/discount-codes', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, active: !c.active }) })
    const d = await r.json()
    if (r.ok) setCodes(cs => (cs ?? []).map(x => (x.id === c.id ? d : x))); else setError(d.error ?? 'Eroare')
  }
  const remove = async (c: CodeRow) => {
    if (!window.confirm(`Ștergi codul ${c.code}? Comenzile deja făcute nu se schimbă.`)) return
    const r = await fetch(`/api/admin/discount-codes?id=${c.id}`, { method: 'DELETE' })
    if (r.ok) { setCodes(cs => (cs ?? []).filter(x => x.id !== c.id)); if (editing?.id === c.id) cancelEdit() } else setError('Nu s-a putut șterge.')
  }
  const status = (c: CodeRow) => {
    const pr = codeProblem(c)
    if (!pr) return { t: 'Valabil', c: 'text-[#0B6B49]' }
    if (!c.active) return { t: 'Oprit', c: 'text-[#8A5300]' }
    if (pr.includes('încă')) return { t: 'Programat', c: 'text-[#5A00C2]' }
    if (pr.includes('expirat')) return { t: 'Expirat', c: 'text-[#B42318]' }
    return { t: 'Epuizat', c: 'text-[#B42318]' }
  }
  const price = currentPrice(product).price
  const preview = Number(f.value) > 0 ? applyCode(price, { type: f.type, value: Number(f.value) }) : null

  return (
    <div className="g-card rounded-2xl p-5 sm:p-6 mt-4 space-y-4">
      <div>
        <h2 className="font-bold db-title text-base sm:text-lg">Coduri de reducere</h2>
        <p className="text-sm db-muted">Clientul scrie codul în checkout. Reducerea se aplică prețului din acel moment (dacă e o promoție activă, peste prețul promoției); upgrade-ul nu se reduce.</p>
      </div>

      <form id="code-form" onSubmit={save} className={`rounded-xl border p-4 space-y-3 ${editing ? 'border-[#B800BA] bg-[#FBF0FB]' : 'border-black/[.08]'}`}>
        {editing && <p className="text-sm font-semibold text-[#8A008D]">Modifici codul {editing.code} — a fost folosit de {editing.used_count} ori (rămâne contorul).</p>}
        <div className="grid sm:grid-cols-[1fr_auto] gap-2 items-end">
          <div><Label>Cod</Label><input className="g-input uppercase" required value={f.code} placeholder="ex: PRIMAVARA20" onChange={e => setF({ ...f, code: e.target.value })} /></div>
          <button type="button" onClick={gen} className="g-btn g-btn-md !bg-white !text-[#2B2B38] border border-[#D3D3DF]">Generează</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Tip de reducere</Label>
            <select className="g-input" value={f.type} onChange={e => setF({ ...f, type: e.target.value as CodeFields['type'] })}>
              <option value="percent">Procent din preț</option>
              <option value="amount">Sumă fixă scăzută</option>
              <option value="price">Duce prețul la o sumă fixă</option>
            </select>
          </div>
          <div>
            <Label>{f.type === 'percent' ? 'Procent (%)' : f.type === 'amount' ? `Suma scăzută (${product.currency.toUpperCase()})` : `Prețul final (${product.currency.toUpperCase()})`}</Label>
            <input type="number" min="1" max={f.type === 'percent' ? 99 : undefined} required className="g-input" value={f.value} onChange={e => setF({ ...f, value: e.target.value })} />
          </div>
          <div><Label>Valabil de la (opțional)</Label><input type="datetime-local" className="g-input" value={f.starts} onChange={e => setF({ ...f, starts: e.target.value })} /></div>
          <div><Label>Valabil până la (opțional)</Label><input type="datetime-local" className="g-input" value={f.ends} onChange={e => setF({ ...f, ends: e.target.value })} /></div>
          <div><Label>Număr maxim de utilizări (opțional)</Label><input type="number" min="1" className="g-input" value={f.max} placeholder="nelimitat" onChange={e => setF({ ...f, max: e.target.value })} /></div>
        </div>
        <p className="text-xs db-muted">Orele sunt ora României. {preview != null && <>La prețul de acum ({money(price, product.currency)}) clientul ar plăti <strong>{money(preview, product.currency)}</strong>.</>}</p>
        <div className="flex gap-2">
          <button type="submit" disabled={busy} className="g-btn g-btn-md">{busy ? 'Se salvează…' : editing ? 'Salvează modificările' : 'Creează codul'}</button>
          {editing && <button type="button" onClick={cancelEdit} className="g-btn g-btn-md !bg-white !text-[#2B2B38] border border-[#D3D3DF]">Renunță</button>}
        </div>
      </form>

      {error && <p role="alert" className="text-[#B42318] text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}

      {codes === null ? <p className="text-sm db-muted">Se încarcă…</p> : codes.length === 0 ? <p className="text-sm db-muted">Niciun cod încă.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs font-semibold db-muted"><th className="pb-2">Cod</th><th className="pb-2">Reducere</th><th className="pb-2">Valabilitate</th><th className="pb-2 text-right">Folosit</th><th className="pb-2 pl-3">Stare</th><th className="pb-2" /></tr></thead>
            <tbody>{codes.map(c => {
              const st = status(c)
              return (
                <tr key={c.id} className="border-t border-[#EEEEF4]">
                  <td className="py-2 pr-3 font-mono font-semibold">{c.code}</td>
                  <td className="py-2 pr-3 whitespace-nowrap">{codeLabel(c, product.currency)}</td>
                  <td className="py-2 pr-3 text-xs">{c.starts_at ? formatBucharest(c.starts_at) : 'de acum'}<br />{c.ends_at ? `până ${formatBucharest(c.ends_at)}` : 'fără sfârșit'}</td>
                  <td className="py-2 pr-3 text-right tnum">{c.used_count}{c.max_uses != null ? ` / ${c.max_uses}` : ''}</td>
                  <td className={`py-2 pl-3 pr-3 font-semibold ${st.c}`}>{st.t}</td>
                  <td className="py-2 text-right whitespace-nowrap">
                    <button type="button" onClick={() => edit(c)} className="underline mr-3 font-semibold">Modifică</button>
                    <button type="button" onClick={() => toggle(c)} className="underline mr-3">{c.active ? 'Oprește' : 'Activează'}</button>
                    <button type="button" onClick={() => remove(c)} className="underline text-[#B42318]">Șterge</button>
                  </td>
                </tr>
              )
            })}</tbody>
          </table>
        </div>
      )}
    </div>
  )
}
