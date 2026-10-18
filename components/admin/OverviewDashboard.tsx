'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  PRODUCT_COLORS, addDays, bestBucket, bucharestDay, bucharestHour, bucharestTime, buildBuckets, buildHourBuckets,
  compareBounds, dayDiff, daysBetween, indexDaily, indexHourly, isSingleDay, longDay, money, nf, pctChange,
  productLabel, rangeBounds, rangeNote, revenueText, shortDay, sumBuckets, sumDays,
  type DailyRow, type Gran, type HourRow, type ProductInfo, type RangeKey,
} from '@/lib/admin-analytics'
import { WINDOW_DAYS, fetchHourly, fetchOrders, type OrderRow, type OrdersResult } from '@/lib/admin-sales'
import { writeFiltersCookie, type OverviewFilters } from '@/lib/overview-filters'
import BarChart from '@/components/admin/BarChart'

type RecentRow = { id: string; name: string | null; email: string; amount: number | null; currency: string; created_at: string; product_id: string | null; bump_included: boolean }
type OrdersState = { loading: boolean; error?: string; data?: OrdersResult }
type View = Gran | 'hour'

const UNIT: Record<View, string> = { hour: 'oră', day: 'zi', week: 'săptămână', month: 'lună' }
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const defaultGran = (len: number): Gran => (len > 200 ? 'month' : len > 60 ? 'week' : 'day')

const CARD = 'bg-white border border-[#E4E4EC] rounded-[14px] shadow-[0_1px_2px_rgba(16,16,32,.04)]'

const PRESETS: { v: RangeKey; label: string }[] = [
  { v: 'today', label: 'Azi' }, { v: 'yesterday', label: 'Ieri' }, { v: 'week', label: 'Săptămâna aceasta' },
  { v: 'month', label: 'Luna aceasta' }, { v: 'lastmonth', label: 'Luna trecută' },
]
const ROLLING: { v: RangeKey; label: string }[] = [
  { v: 7, label: '7 zile' }, { v: 30, label: '30 zile' }, { v: 90, label: '90 zile' }, { v: 365, label: '12 luni' },
]

function Segmented<T extends string | number>({ label, value, options, onChange }: {
  label: string; value: T; options: { v: T; label: string }[]; onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <div className="text-[13px] leading-[18px] font-semibold text-[#5A5A6C]">{label}</div>
      <div role="group" aria-label={label} className="flex sm:inline-flex gap-0.5 p-[3px] bg-[#F0F0F6] rounded-[10px]">
        {options.map(o => {
          const on = o.v === value
          return (
            <button key={String(o.v)} type="button" aria-pressed={on} onClick={() => onChange(o.v)}
              className={`flex-1 sm:flex-none min-h-11 sm:min-h-0 px-2.5 sm:px-3.5 sm:py-2 rounded-lg text-sm leading-5 font-semibold transition-colors whitespace-nowrap ${
                on ? 'bg-white text-[#15151C] shadow-[0_1px_2px_rgba(16,16,32,.16)]' : 'text-[#5A5A6C] hover:text-[#15151C]'
              }`}>
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-pressed={on} onClick={onClick}
      className={`min-h-11 sm:min-h-9 px-3.5 rounded-full border text-sm leading-5 font-semibold transition-colors whitespace-nowrap ${
        on ? 'border-[#B800BA] bg-[#FBEBFB] text-[#8A008D]' : 'border-[#D3D3DF] bg-white text-[#34343F] hover:bg-[#F6F6FA]'
      }`}>
      {children}
    </button>
  )
}

type PInfo = ProductInfo & { colorFg: string; colorBg: string; colorBar: string }

function Chip({ p, children }: { p: PInfo | undefined; children: React.ReactNode }) {
  const c = PRODUCT_COLORS[0]
  return (
    <span className="px-2.5 py-0.5 rounded-full text-xs leading-[18px] font-semibold whitespace-nowrap"
      style={{ background: p?.colorBg ?? c.bg, color: p?.colorFg ?? c.fg }}>
      {children}
    </span>
  )
}

export default function OverviewDashboard({ today, nowHour, initial, products, daily, recent }: {
  today: string; nowHour: number; initial: OverviewFilters
  products: ProductInfo[]; daily: DailyRow[]; recent: RecentRow[]
}) {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const [product, setProduct] = useState<string>(initial.product)
  const [range, setRange] = useState<RangeKey>(initial.range)
  const [gran, setGran] = useState<Gran>(initial.gran)
  const [custom, setCustom] = useState({ from: initial.from ?? addDays(today, -29), to: initial.to ?? today })
  const [open, setOpen] = useState('')
  const [orders, setOrders] = useState<Record<string, OrdersState>>({})
  const [hourly, setHourly] = useState<{ day: string; rows: HourRow[]; error?: string } | null>(null)
  const [hour, setHour] = useState(nowHour)
  const [connected, setConnected] = useState(false)

  const pinfo = useMemo<PInfo[]>(() => products.map((p, i) => {
    const c = PRODUCT_COLORS[i % PRODUCT_COLORS.length]
    return { ...p, colorFg: c.fg, colorBg: c.bg, colorBar: c.bar }
  }), [products])
  const byId = useMemo(() => new Map(pinfo.map(p => [p.id, p])), [pinfo])

  // Filtrele rămân după reîncărcarea paginii
  useEffect(() => {
    writeFiltersCookie({ product, range, gran, ...(range === 'custom' ? { from: custom.from, to: custom.to } : {}) })
  }, [product, range, gran, custom])

  // Ora curentă (pentru "Azi": se arată orele până acum)
  useEffect(() => {
    const t = setInterval(() => setHour(bucharestHour(new Date())), 60_000)
    return () => clearInterval(t)
  }, [])

  // Vânzare nouă → reîncarcă datele dal server
  useEffect(() => {
    const ch = supabase.channel('admin-purchases')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'purchases' }, () => {
        setOrders({})
        router.refresh()
      })
      .subscribe(s => setConnected(s === 'SUBSCRIBED'))
    return () => { supabase.removeChannel(ch) }
  }, [supabase, router])

  const minDay = addDays(today, -(WINDOW_DAYS - 1))
  const { from, to } = useMemo(() => rangeBounds(range, today, custom, minDay), [range, today, custom, minDay])
  const single = isSingleDay(range)
  const view: View = single ? 'hour' : gran
  const cmp = useMemo(() => compareBounds(range, from, to), [range, from, to])
  const hasPrev = cmp.from >= minDay

  // Dettaglio orario: se carică per ziua aleasă (și se reîncarcă după fiecare vânzare nouă)
  useEffect(() => {
    if (!single) return
    let off = false
    fetchHourly(supabase, from)
      .then(rows => { if (!off) setHourly({ day: from, rows }) })
      .catch(e => { if (!off) setHourly({ day: from, rows: [], error: e instanceof Error ? e.message : 'Eroare la încărcare' }) })
    return () => { off = true }
  }, [single, from, supabase, daily])

  const filter = product === 'all' ? null : product
  const idx = useMemo(() => indexDaily(daily, filter), [daily, filter])
  const hourRows = hourly && hourly.day === from ? hourly.rows : null
  const buckets = useMemo(() => {
    if (single) return buildHourBuckets(from, from === today ? hour : 23, indexHourly(hourRows ?? [], filter))
    return buildBuckets(daysBetween(from, to), gran, idx)
  }, [single, from, to, today, hour, hourRows, filter, gran, idx])
  const total = useMemo(() => sumBuckets(buckets), [buckets])
  const prev = useMemo(() => (hasPrev ? sumDays(daysBetween(cmp.from, cmp.to), idx) : null), [hasPrev, cmp, idx])
  const best = useMemo(() => bestBucket(buckets), [buckets])

  const selected = filter ? pinfo.filter(p => p.id === filter) : pinfo
  const curOrder = useMemo(() => {
    const list = [...new Set(selected.map(p => p.currency.toLowerCase()))]
    for (const c of Object.keys(total.cur)) if (!list.includes(c)) list.push(c)
    return list.length ? list : ['ron']
  }, [selected, total])

  const unit = UNIT[view]
  const periodNote = rangeNote(range, from, to)
  const salesDelta = prev ? pctChange(total.sales, prev.sales) : null

  const step = Math.max(1, Math.ceil(buckets.length / (view === 'hour' ? 8 : 7)))
  const mkBars = (pick: (b: (typeof buckets)[number]) => number, fmt: (n: number) => string) =>
    buckets.map((b, i) => ({ value: pick(b), tip: `${b.long}: ${fmt(pick(b))}`, label: b.label, showLabel: i % step === 0 }))

  const charts = [
    ...curOrder.map((c, ci) => ({
      key: `rev-${c}`,
      title: `Venit ${c.toUpperCase()}`,
      sub: `pe ${unit}${filter ? ' · ' + productLabel(selected[0]) : ''}`,
      total: money(total.cur[c]?.revenue ?? 0, c),
      color: filter ? selected[0].colorBar : PRODUCT_COLORS[ci % PRODUCT_COLORS.length].bar,
      bars: mkBars(b => b.agg.cur[c]?.revenue ?? 0, n => money(n, c)),
    })),
    {
      key: 'sales', title: 'Număr de vânzări', sub: `pe ${unit}`, total: nf(total.sales), color: '#3B3B52',
      bars: mkBars(b => b.agg.sales, n => `${nf(n)} vânzări`),
    },
  ]

  const rows = useMemo(() => [...buckets].reverse(), [buckets])

  // Ordinele unei perioade. Pentru orele unei zile se încarcă o singură dată ordinele zilei și se filtrează după oră.
  const toggle = async (b: (typeof buckets)[number]) => {
    const key = `${filter ?? 'all'}|${b.key}`
    if (open === key) { setOpen(''); return }
    setOpen(key)
    const fetchKey = single ? `${filter ?? 'all'}|${b.from}|zi` : key
    if (orders[fetchKey]?.data || orders[fetchKey]?.loading) return
    setOrders(o => ({ ...o, [fetchKey]: { loading: true } }))
    try {
      const data = await fetchOrders(supabase, b.from, b.to, filter, single ? 200 : 20)
      setOrders(o => ({ ...o, [fetchKey]: { loading: false, data } }))
    } catch (e) {
      setOrders(o => ({ ...o, [fetchKey]: { loading: false, error: e instanceof Error ? e.message : 'Eroare la încărcare' } }))
    }
  }

  const pickRange = (v: RangeKey) => {
    setRange(v)
    setOpen('')
    const r = rangeBounds(v, today, custom, minDay)
    if (!isSingleDay(v)) setGran(defaultGran(dayDiff(r.from, r.to) + 1))
  }

  const orderWhen = (o: OrderRow) => {
    const t = bucharestTime(o.created_at)
    return view === 'day' || view === 'hour' ? t : `${shortDay(bucharestDay(o.created_at))}, ${t}`
  }

  const kpis: { label: string; lines: { t: string; size: string }[]; delta?: { text: string; ok: boolean }; note: string }[] = [
    {
      label: 'Venit în perioadă',
      lines: curOrder.map(c => ({ t: money(total.cur[c]?.revenue ?? 0, c), size: curOrder.length > 1 ? 'text-2xl' : 'text-3xl' })),
      note: periodNote,
    },
    {
      label: 'Vânzări',
      lines: [{ t: nf(total.sales), size: 'text-3xl' }],
      delta: salesDelta === null ? undefined : { text: `${salesDelta >= 0 ? '↑' : '↓'} ${Math.abs(salesDelta)}%`, ok: salesDelta >= 0 },
      note: [salesDelta === null ? '' : cmp.label, total.bumps > 0 ? `${nf(total.bumps)} cu upgrade` : ''].filter(Boolean).join(' · ') || periodNote,
    },
    {
      label: 'Comandă medie',
      lines: curOrder.map(c => {
        const t = total.cur[c]
        return { t: money(t && t.sales ? t.revenue / t.sales : 0, c), size: curOrder.length > 1 ? 'text-2xl' : 'text-3xl' }
      }),
      note: 'incluzând upgrade-urile',
    },
    {
      label: `Cea mai bună ${unit}`,
      lines: [{ t: best ? best.long : '—', size: 'text-[22px]' }],
      note: best ? `${nf(best.agg.sales)} vânzări · ${revenueText(best.agg.cur, curOrder)}` : 'nicio vânzare în perioadă',
    },
  ]

  const tableTitle = `${cap(unit)} cu ${unit}`
  const clientiHref = filter ? `/admin/clienti?p=${byId.get(filter)?.slug ?? ''}` : '/admin/clienti'
  const COLS = 'sm:grid-cols-[minmax(120px,1.1fr)_76px_minmax(130px,1.2fr)_minmax(130px,1.2fr)_20px]'
  const hourLoading = single && !hourRows && !hourly?.error

  return (
    <div className="flex flex-col gap-5 sm:gap-6">

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[26px] sm:text-[28px] leading-[34px] sm:leading-9 font-bold tracking-[-0.01em] db-title">Overview</h1>
          <p className="text-sm sm:text-[15px] leading-6 db-muted">Încasări pe produs · {longDay(today)} {today.slice(0, 4)}</p>
        </div>
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[13px] leading-5 font-semibold ${connected ? 'bg-[#E3F6EE] text-[#0B6B49]' : 'bg-[#EEEEF4] text-[#5A5A6C]'}`}>
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-[#12A06E]' : 'bg-[#8A8AA0]'}`} />
          {connected ? 'Live' : 'Offline'}
        </div>
      </div>

      {/* Filtre */}
      <section aria-label="Filtre" className={`${CARD} p-4 sm:px-5 flex flex-col gap-4`}>
        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4 sm:gap-x-6 sm:items-end">
          <Segmented label="Produs" value={product} onChange={v => { setProduct(v); setOpen('') }}
            options={[{ v: 'all', label: 'Toate' }, ...pinfo.map(p => ({ v: p.id, label: productLabel(p) }))]} />
          {!single && (
            <Segmented label="Detaliu" value={gran} onChange={v => { setGran(v); setOpen('') }}
              options={[{ v: 'day', label: 'Zi' }, { v: 'week', label: 'Săptămână' }, { v: 'month', label: 'Lună' }]} />
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="text-[13px] leading-[18px] font-semibold text-[#5A5A6C]">Perioadă</div>
          <div role="group" aria-label="Perioadă" className="flex flex-wrap items-center gap-2">
            {PRESETS.map(p => <Pill key={String(p.v)} on={range === p.v} onClick={() => pickRange(p.v)}>{p.label}</Pill>)}
            <span className="hidden sm:block w-px h-6 bg-[#E4E4EC] mx-1" aria-hidden />
            {ROLLING.map(p => <Pill key={String(p.v)} on={range === p.v} onClick={() => pickRange(p.v)}>{p.label}</Pill>)}
            <span className="hidden sm:block w-px h-6 bg-[#E4E4EC] mx-1" aria-hidden />
            <Pill on={range === 'custom'} onClick={() => pickRange('custom')}>Interval personalizat</Pill>
          </div>
        </div>
        {range === 'custom' && (
          <div className="grid grid-cols-2 gap-3 sm:max-w-md">
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#5A5A6C]">
              De la
              <input type="date" className="g-input" value={custom.from} min={minDay} max={today}
                onChange={e => { setCustom(c => ({ ...c, from: e.target.value || c.from })); setOpen('') }} />
            </label>
            <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-[#5A5A6C]">
              Până la
              <input type="date" className="g-input" value={custom.to} min={minDay} max={today}
                onChange={e => { setCustom(c => ({ ...c, to: e.target.value || c.to })); setOpen('') }} />
            </label>
          </div>
        )}
      </section>

      {/* Indicatori */}
      <section aria-label="Indicatori" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((k, i) => (
          <div key={k.label} className={`${CARD} p-4 sm:p-5 flex flex-col gap-1.5 ${i === 0 || i === kpis.length - 1 ? 'col-span-2 lg:col-span-1' : ''}`}>
            <div className="text-sm leading-5 font-semibold text-[#5A5A6C]">{k.label}</div>
            <div className="flex flex-wrap gap-x-5 lg:block">
              {k.lines.map((l, j) => (
                <div key={j} className={`${l.size} leading-9 font-bold tracking-[-0.01em] tnum text-[#15151C] break-words`}>{l.t}</div>
              ))}
            </div>
            <div className="text-[13px] leading-5 text-[#5A5A6C]">
              {k.delta && <span className="font-semibold mr-1" style={{ color: k.delta.ok ? '#0B6B49' : '#B42318' }}>{k.delta.text}</span>}
              {k.note}
            </div>
          </div>
        ))}
      </section>

      {/* Grafice */}
      <section aria-label="Grafice" className="grid grid-cols-1 md:grid-cols-[repeat(auto-fit,minmax(340px,1fr))] gap-3 sm:gap-4">
        {charts.map(c => (
          <div key={c.key} className={`${CARD} p-4 sm:p-5 flex flex-col gap-3.5`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-base leading-6 font-semibold db-title">{c.title}</h2>
                <div className="text-[13px] leading-5 db-muted">{c.sub}</div>
              </div>
              <div className="text-lg sm:text-xl leading-7 font-bold tnum whitespace-nowrap text-[#15151C]">{c.total}</div>
            </div>
            <BarChart bars={c.bars} color={c.color} ariaLabel={`${c.title}, ${c.sub}: total ${c.total}`} />
          </div>
        ))}
      </section>

      {/* Tabel + vânzări recente */}
      <div className="flex flex-col xl:flex-row gap-3 sm:gap-4 items-start">

        <section aria-label={tableTitle} className={`${CARD} w-full xl:flex-[2_1_0%] min-w-0 overflow-hidden`}>
          <div className="px-4 sm:px-5 pt-4 sm:pt-[18px] pb-3.5">
            <h2 className="text-lg leading-[26px] font-semibold db-title">{tableTitle}</h2>
            <div className="text-sm leading-5 db-muted">
              {hourLoading ? 'Se încarcă orele…' : hourly?.error && single ? <span className="text-[#B42318]">Nu am putut încărca orele: {hourly.error}</span> : 'Apasă pe un rând ca să vezi comenzile din acea perioadă.'}
            </div>
          </div>
          <div className={`hidden sm:grid ${COLS} gap-3 px-5 py-2.5 bg-[#F6F6FA] border-y border-[#E4E4EC] text-[13px] leading-[18px] font-semibold text-[#5A5A6C]`}>
            <div>Perioadă</div><div>Vânzări</div><div>Venit</div><div>Produse</div><div />
          </div>
          <div className="max-h-[520px] overflow-y-auto border-t border-[#E4E4EC] sm:border-t-0">
            {rows.map(b => {
              const key = `${filter ?? 'all'}|${b.key}`
              const isOpen = open === key
              const st = orders[single ? `${filter ?? 'all'}|${b.from}|zi` : key]
              const empty = b.agg.sales === 0
              const chips = Object.entries(b.agg.prod).filter(([, v]) => v.sales > 0)
              const h = single ? Number(b.key.slice(-2)) : -1
              const shown = st?.data ? (single ? st.data.rows.filter(o => bucharestHour(o.created_at) === h) : st.data.rows) : []
              const hiddenCount = single ? Math.max(0, b.agg.sales - shown.length) : (st?.data ? st.data.total - st.data.rows.length : 0)
              return (
                <div key={b.key} className="border-b border-[#EEEEF4] last:border-b-0">
                  <button type="button" aria-expanded={isOpen} aria-controls={`o-${b.key}`} onClick={() => toggle(b)}
                    className={`w-full text-left px-4 sm:px-5 py-3 min-h-16 sm:min-h-0 text-sm leading-5 text-[#15151C] transition-colors hover:bg-[#FAFAFD] ${isOpen ? 'bg-[#FAFAFD]' : 'bg-white'}`}>
                    {/* mobil */}
                    <div className="sm:hidden flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] leading-[22px] font-semibold">{b.long}</div>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {chips.map(([pid, v]) => <Chip key={pid} p={byId.get(pid)}>{pid === 'none' ? 'Altele' : productLabel(byId.get(pid) ?? { slug: '?' })} {v.sales}</Chip>)}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold tnum ${empty ? 'text-[#6C6C80]' : ''}`}>{revenueText(b.agg.cur, curOrder)}</div>
                        <div className="text-[13px] leading-[18px] text-[#5A5A6C]">{b.agg.sales} vânzări</div>
                      </div>
                      <Chevron open={isOpen} />
                    </div>
                    {/* desktop */}
                    <div className={`hidden sm:grid ${COLS} gap-3 items-center`}>
                      <div className="font-semibold">{b.long}</div>
                      <div className={`font-semibold tnum ${empty ? 'text-[#6C6C80]' : ''}`}>{b.agg.sales}</div>
                      <div className={`tnum ${empty ? 'text-[#6C6C80]' : ''}`}>{revenueText(b.agg.cur, curOrder)}</div>
                      <div className="flex flex-wrap gap-1.5">
                        {chips.map(([pid, v]) => <Chip key={pid} p={byId.get(pid)}>{pid === 'none' ? 'Altele' : productLabel(byId.get(pid) ?? { slug: '?' })} {v.sales}</Chip>)}
                      </div>
                      <Chevron open={isOpen} />
                    </div>
                  </button>
                  {isOpen && (
                    <div id={`o-${b.key}`} className="bg-[#FAFAFD] px-4 sm:px-5 pt-1.5 pb-4 border-t border-[#EEEEF4]">
                      {empty && <div className="py-2 text-sm db-muted">Nicio vânzare în această perioadă.</div>}
                      {!empty && st?.loading && <div className="py-3 text-sm db-muted">Se încarcă comenzile…</div>}
                      {!empty && st?.error && <div className="py-3 text-sm text-[#B42318]">Nu am putut încărca comenzile: {st.error}</div>}
                      {!empty && shown.map(o => {
                        const p = o.product_id ? byId.get(o.product_id) : undefined
                        return (
                          <div key={o.id} className="grid grid-cols-[56px_minmax(0,1fr)_auto] sm:grid-cols-[96px_minmax(120px,1fr)_130px_100px] gap-x-3 gap-y-0.5 items-center py-2 border-b border-[#EEEEF4] last:border-b-0 text-sm leading-5">
                            <div className="text-[#5A5A6C] tnum">{orderWhen(o)}</div>
                            <div className="min-w-0">
                              <div className="font-medium truncate">{o.name || o.email}</div>
                              <div className="sm:hidden text-[13px] leading-[18px] text-[#5A5A6C]">{p ? productLabel(p) : 'Altele'}{o.bump_included ? ' + upgrade' : ''}</div>
                            </div>
                            <div className="hidden sm:block text-[#34343F]">{p ? productLabel(p) : 'Altele'}{o.bump_included ? ' + upgrade' : ''}</div>
                            <div className="text-right font-semibold tnum">{money(o.amount ?? 0, o.currency)}</div>
                          </div>
                        )
                      })}
                      {!empty && st?.data && hiddenCount > 0 && (
                        <Link href={clientiHref} className="inline-block pt-3 text-[13px] leading-[18px] font-semibold text-[#8A008D] hover:underline">
                          + {hiddenCount} alte comenzi · vezi toate în Clienți
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-[#F6F6FA] border-t border-[#D3D3DF] text-sm leading-5 font-bold">
            <span>Total perioadă</span>
            <span className="tnum text-right">{nf(total.sales)} · {revenueText(total.cur, curOrder)}</span>
          </div>
        </section>

        <section aria-label="Vânzări recente" className={`${CARD} w-full xl:flex-[1_1_0%] min-w-0 overflow-hidden`}>
          <div className="px-4 sm:px-5 pt-4 sm:pt-[18px] pb-3 flex items-baseline justify-between gap-2">
            <h2 className="text-lg leading-[26px] font-semibold db-title">Vânzări recente</h2>
            <Link href="/admin/clienti" className="text-sm leading-5 font-semibold text-[#8A008D] hover:underline">Toate</Link>
          </div>
          <div className="px-4 sm:px-5 pb-2">
            {recent.length === 0 && <div className="py-8 text-center text-sm db-muted">Nicio vânzare încă.</div>}
            {recent.map(o => {
              const p = o.product_id ? byId.get(o.product_id) : undefined
              const nm = o.name || o.email
              return (
                <div key={o.id} className="flex items-center gap-3 py-3 border-t border-[#EEEEF4]">
                  <div className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-[13px]"
                    style={{ background: p?.colorBg ?? '#F4D3F5', color: p?.colorFg ?? '#7A007D' }}>
                    {nm.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm leading-5 font-semibold truncate">{nm}</div>
                    <div className="text-[13px] leading-[18px] text-[#5A5A6C]">
                      {p ? productLabel(p) : 'Altele'}{o.bump_included ? ' + upgrade' : ''} · {shortDay(bucharestDay(o.created_at))}, {bucharestTime(o.created_at)}
                    </div>
                  </div>
                  <div className="text-sm leading-5 font-bold tnum whitespace-nowrap">{money(o.amount ?? 0, o.currency)}</div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </div>
  )
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#5A5A6C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      className={`w-[18px] h-[18px] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden>
      <path d="M6 9l6 6 6-6" />
    </svg>
  )
}
