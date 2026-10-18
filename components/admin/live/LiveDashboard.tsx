'use client'
import dynamic from 'next/dynamic'
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react'
import {
  ACTIVE_SEC, RECENT_SEC, STAGES, countryName, agoText, durationText, eventText, money, pageLabel, pct, placeText, secondsAgo, sourceText, stageOf,
  type LiveSession, type SessionEvent, type Summary,
} from '@/lib/live-types'

const LiveMap = dynamic(() => import('./LiveMap'), { ssr: false, loading: () => <div className="h-[380px] sm:h-[460px] rounded-[10px] bg-[#EEEEF4]" /> })

type Win = 'now' | 'today' | 'yesterday' | '7d' | '30d'
const WINDOWS: { key: Win; label: string }[] = [
  { key: 'now', label: 'Acum (30 min)' }, { key: 'today', label: 'Azi' }, { key: 'yesterday', label: 'Ieri' },
  { key: '7d', label: '7 zile' }, { key: '30d', label: '30 zile' },
]
const WIN_KEY = 'live_window'

async function get<T>(qs: string): Promise<T> {
  const r = await fetch(`/api/admin/live?${qs}`, { cache: 'no-store' })
  if (!r.ok) throw new Error((await r.json().catch(() => null))?.error ?? `Eroare ${r.status}`)
  return r.json()
}

function StageBadge({ stage }: { stage: string }) {
  const s = stageOf(stage)
  return <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap" style={{ background: s.bg, color: s.fg }}>
    <span className="w-2 h-2 rounded-full" style={{ background: s.dot }} />{s.label}</span>
}

function Table({ title, head, rows }: { title: string; head: string[]; rows: (string | number)[][] }) {
  return (
    <div className="g-card p-4 sm:p-5 min-w-0">
      <h3 className="text-base font-semibold text-[#15151C] mb-3">{title}</h3>
      {rows.length === 0 ? <p className="text-sm db-muted">Încă nu sunt date.</p> : (
        <table className="w-full text-sm">
          <thead><tr>{head.map((h, i) => <th key={i} className={`pb-2 text-xs font-semibold db-muted ${i ? 'text-right' : 'text-left'}`}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => (
            <tr key={i} className="border-t border-[#EEEEF4]">{r.map((c, j) => <td key={j} className={`py-1.5 ${j ? 'text-right tnum' : 'text-left truncate max-w-[220px]'}`}>{c}</td>)}</tr>
          ))}</tbody>
        </table>
      )}
    </div>
  )
}

export default function LiveDashboard() {
  const [win, setWin] = useState<Win>('today')
  const [sessions, setSessions] = useState<LiveSession[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [tick, setTick] = useState(() => Date.now())
  const [sel, setSel] = useState<string | null>(null)
  const [ev, setEv] = useState<{ id: string; list: SessionEvent[] } | null>(null)
  const [updated, setUpdated] = useState<number | null>(null)

  // fereastra aleasă rămâne și după reîncărcare
  useEffect(() => {
    const t = setTimeout(() => { try { const w = localStorage.getItem(WIN_KEY) as Win | null; if (w && WINDOWS.some(x => x.key === w)) setWin(w) } catch {} }, 0)
    return () => clearTimeout(t)
  }, [])
  const pick = (w: Win) => { setWin(w); try { localStorage.setItem(WIN_KEY, w) } catch {} }

  const loadNow = useCallback(async () => {
    try { setSessions(await get<LiveSession[]>(`part=now&s=${RECENT_SEC}`)); setErr(null); setUpdated(Date.now()) }
    catch (e) { setErr(e instanceof Error ? e.message : 'Eroare') }
  }, [])
  const loadSummary = useCallback(async () => {
    try { setSummary(await get<Summary>(`part=summary&w=${win}`)) } catch (e) { setErr(e instanceof Error ? e.message : 'Eroare') }
  }, [win])

  // reîmprospătare automată cât timp fila e vizibilă
  useEffect(() => {
    const t0 = setTimeout(() => { loadNow(); loadSummary() }, 0)
    const id = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      setTick(Date.now()); loadNow()
    }, 5000)
    const id2 = setInterval(() => { if (document.visibilityState === 'visible') loadSummary() }, 30000)
    const vis = () => { if (document.visibilityState === 'visible') { loadNow(); loadSummary() } }
    document.addEventListener('visibilitychange', vis)
    return () => { clearTimeout(t0); clearInterval(id); clearInterval(id2); document.removeEventListener('visibilitychange', vis) }
  }, [loadNow, loadSummary])

  useEffect(() => {
    if (!sel) return
    let dead = false
    const load = () => get<SessionEvent[]>(`part=session&id=${sel}`).then(d => { if (!dead) setEv({ id: sel, list: d }) }).catch(() => { if (!dead) setEv({ id: sel, list: [] }) })
    load()
    const id = setInterval(load, 8000)
    return () => { dead = true; clearInterval(id) }
  }, [sel])

  const now = tick
  const active = useMemo(() => sessions.filter(s => secondsAgo(s.last_seen, now) <= ACTIVE_SEC), [sessions, now])
  const hot = useMemo(() => active.filter(s => s.stage_rank >= 2 && s.stage_rank < 5), [active])
  const events = ev && ev.id === sel ? ev.list : null
  const selected = sessions.find(s => s.id === sel) ?? null
  const f = summary?.funnel

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#15151C] flex items-center gap-2.5">Live
            <span className="flex items-center gap-1.5 text-sm font-semibold text-[#0B6B49]"><span className="w-2.5 h-2.5 rounded-full bg-[#12A06E]" />în direct</span></h1>
          <p className="text-sm db-muted mt-1">Cine e pe site, de unde vine și cât de aproape e de cumpărare. Date anonime, fără cookie, fără adresa IP.
            {updated && <> Actualizat {agoText(secondsAgo(new Date(updated).toISOString(), now))}.</>}</p>
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Perioadă pentru statistici">
          {WINDOWS.map(w => (
            <button key={w.key} onClick={() => pick(w.key)} aria-pressed={win === w.key}
              className={`px-3.5 h-10 rounded-[10px] text-sm font-semibold border ${win === w.key ? 'bg-[#15151C] text-white border-[#15151C]' : 'bg-white text-[#2B2B38] border-[#D3D3DF] hover:bg-[#F6F6FA]'}`}>{w.label}</button>
          ))}
        </div>
      </div>

      {err && <div role="alert" className="rounded-[10px] border border-[#F4C7C3] bg-[#FDE8E6] text-[#B42318] text-sm px-4 py-3">
        Nu pot încărca datele: {err}. Dacă ai creat tabelele abia acum, verifică că migrarea „live_visitors” a fost aplicată în Supabase.</div>}

      {hot.length > 0 && (
        <div role="status" className="rounded-[10px] border border-[#F6D7A8] bg-[#FDF1DC] px-4 py-3 text-[#6B3F00]">
          <p className="font-semibold">🔥 {hot.length} {hot.length === 1 ? 'vizitator e' : 'vizitatori sunt'} aproape de cumpărare</p>
          <ul className="mt-1 text-sm space-y-0.5">
            {hot.map(s => <li key={s.id}><button className="underline underline-offset-2 text-left" onClick={() => setSel(s.id)}>
              {placeText(s)} — {stageOf(s.stage).label.toLowerCase()}{s.cart_value ? ` (${money(s.cart_value, s.cart_currency)})` : ''}</button></li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          ['Pe site acum', active.length, '#0B6B49'],
          ['Văd oferta', active.filter(s => s.stage_rank === 1).length, '#5A00C2'],
          ['În checkout', active.filter(s => s.stage_rank === 2).length, '#8A5300'],
          ['Completează / plătesc', active.filter(s => s.stage_rank === 3 || s.stage_rank === 4).length, '#B42318'],
          ['Au cumpărat (10 min)', sessions.filter(s => s.stage_rank === 5).length, '#0B6B49'],
        ].map(([l, n, c]) => (
          <div key={l as string} className="g-card p-4">
            <p className="text-[28px] leading-9 font-bold tnum" style={{ color: c as string }}>{n as number}</p>
            <p className="text-sm font-medium db-muted">{l as string}</p>
          </div>
        ))}
      </div>

      <div className="g-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-base font-semibold text-[#15151C]">Harta vizitatorilor</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs db-muted" aria-label="Legendă">
            {STAGES.map(s => <span key={s.key} className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: s.dot }} />{s.short}</span>)}
          </div>
        </div>
        <LiveMap sessions={sessions.filter(s => secondsAgo(s.last_seen, now) <= RECENT_SEC)} heat={summary?.heat ?? []} selected={sel} onSelect={setSel} />
        <p className="text-xs db-muted mt-2">Punctele = vizitatori din ultimele 10 minute. Zona colorată = unde au fost vizitatorii în perioada aleasă ({WINDOWS.find(w => w.key === win)?.label.toLowerCase()}); roșu = mai mulți. Poziția e aproximativă (la nivel de oraș).</p>
      </div>

      <div className="grid lg:grid-cols-[1fr_340px] gap-5 items-start">
        <div className="g-card p-4 sm:p-5 min-w-0">
          <h2 className="text-base font-semibold text-[#15151C] mb-3">Vizitatori (ultimele 10 minute)</h2>
          {sessions.length === 0 ? <p className="text-sm db-muted">Niciun vizitator în ultimele 10 minute.</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs font-semibold db-muted">
                  <th className="pb-2">Locație</th><th className="pb-2">Etapă</th><th className="pb-2">Pagină acum</th><th className="pb-2">Sursă</th><th className="pb-2 hidden 2xl:table-cell">Dispozitiv</th><th className="pb-2 text-right">Pe site</th><th className="pb-2 text-right">Ultima activitate</th></tr></thead>
                <tbody>{sessions.map(s => {
                  const live = secondsAgo(s.last_seen, now) <= ACTIVE_SEC
                  return (
                    <tr key={s.id} onClick={() => setSel(s.id)} className={`border-t border-[#EEEEF4] cursor-pointer hover:bg-[#F6F6FA] ${sel === s.id ? 'bg-[#F0F0F8]' : ''}`}>
                      <td className="py-2 pr-3"><span className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${live ? 'bg-[#12A06E]' : 'bg-[#B8B8C8]'}`} aria-label={live ? 'activ' : 'inactiv'} />{placeText(s)}</span></td>
                      <td className="py-2 pr-3"><StageBadge stage={s.stage} /></td>
                      <td className="py-2 pr-3">{pageLabel(s.current_path)}</td>
                      <td className="py-2 pr-3">{sourceText(s.source, s.medium)}</td>
                      <td className="py-2 pr-3 whitespace-nowrap hidden 2xl:table-cell">{[s.device, s.browser].filter(Boolean).join(' · ')}</td>
                      <td className="py-2 pr-3 text-right tnum whitespace-nowrap">{durationText(Math.max(s.active_seconds, 0))}</td>
                      <td className="py-2 text-right tnum whitespace-nowrap">{agoText(secondsAgo(s.last_seen, now))}</td>
                    </tr>
                  )
                })}</tbody>
              </table>
            </div>
          )}
        </div>

        <aside className="g-card p-4 sm:p-5 lg:sticky lg:top-6" aria-label="Detalii vizitator">
          <h2 className="text-base font-semibold text-[#15151C] mb-3">Detalii vizitator</h2>
          {!selected ? <p className="text-sm db-muted">Alege un vizitator din listă sau de pe hartă ca să vezi tot ce a făcut.</p> : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2"><StageBadge stage={selected.stage} />
                <button onClick={() => setSel(null)} className="text-xs underline db-muted">Închide</button></div>
              <dl className="grid grid-cols-[110px_1fr] gap-y-1">
                {([
                  ['Locație', placeText(selected) + (selected.region ? ` (${selected.region})` : '')],
                  ['Sursă', sourceText(selected.source, selected.medium) + (selected.campaign ? ` · ${selected.campaign}` : '')],
                  ['A venit de la', selected.referrer || 'direct'],
                  ['Prima pagină', pageLabel(selected.landing_path)],
                  ['Acum pe', pageLabel(selected.current_path)],
                  ['Dispozitiv', [selected.device, selected.os, selected.browser].filter(Boolean).join(' · ')],
                  ['Limbă', selected.lang || '—'],
                  ['Pagini văzute', selected.page_views],
                  ['Derulare maximă', `${selected.max_scroll}%`],
                  ['Timp activ', durationText(selected.active_seconds)],
                  ['Prima vizită', new Date(selected.first_seen).toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest' })],
                  ...(selected.cart_value ? [['Coș', money(selected.cart_value, selected.cart_currency)]] : []),
                  ...(selected.purchase ? [['Comandă', `${selected.purchase.name ?? ''} ${money(selected.purchase.amount, selected.purchase.currency)}`]] : []),
                ] as [string, string | number][]).map(([k, v]) => <Fragment key={k}><dt className="db-muted">{k}</dt><dd className="text-[#15151C] break-words">{v}</dd></Fragment>)}
              </dl>
              <div>
                <h3 className="text-sm font-semibold mb-1.5">Cronologie</h3>
                {events === null ? <p className="db-muted">Se încarcă…</p> : events.length === 0 ? <p className="db-muted">Fără evenimente.</p> : (
                  <ol className="border-l-2 border-[#E4E4EC] pl-3 space-y-2 max-h-[320px] overflow-y-auto">
                    {events.map((e, i) => <li key={i}><span className="text-xs tnum db-muted">{new Date(e.at).toLocaleTimeString('ro-RO', { timeZone: 'Europe/Bucharest' })}</span><br />{eventText(e)}</li>)}
                  </ol>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      <div className="g-card p-4 sm:p-5">
        <h2 className="text-base font-semibold text-[#15151C] mb-3">Parcursul spre cumpărare — {WINDOWS.find(w => w.key === win)?.label.toLowerCase()}</h2>
        {!f || f.visitors === 0 ? <p className="text-sm db-muted">Încă nu sunt vizitatori în această perioadă.</p> : (
          <div className="space-y-2">
            {([
              ['Vizitatori', f.visitors], ['Au văzut oferta', f.offer], ['Au ajuns în checkout', f.checkout],
              ['Au completat datele', f.form], ['Au apăsat „Plătește”', f.paying], ['Au cumpărat', f.purchased],
            ] as [string, number][]).map(([l, n], i) => (
              <div key={l} className="grid grid-cols-[170px_1fr_90px] items-center gap-3 text-sm">
                <span>{l}</span>
                <div className="h-6 rounded bg-[#EEEEF4]"><div className="h-6 rounded" style={{ width: `${Math.max(1, (n / f.visitors) * 100)}%`, background: STAGES[i].dot }} /></div>
                <span className="tnum text-right">{n} <span className="db-muted">({pct(n, f.visitors)})</span></span>
              </div>
            ))}
            <p className="text-xs db-muted pt-1">Timp activ mediu: {durationText(Math.round(f.avg_active))} · Au derulat 25% / 50% / 75% / 100%: {f.scroll25} / {f.scroll50} / {f.scroll75} / {f.scroll100}</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Table title="Surse de trafic" head={['Sursă', 'Vizitatori', 'Checkout', 'Cumpărat']}
          rows={(summary?.sources ?? []).map(r => [sourceText(r.source, r.medium), r.n, r.checkout, r.purchased])} />
        <Table title="Campanii (UTM)" head={['Campanie', 'Vizitatori', 'Checkout', 'Cumpărat']}
          rows={(summary?.campaigns ?? []).map(r => [`${r.campaign} (${r.source})`, r.n, r.checkout, r.purchased])} />
        <Table title="Țări" head={['Țară', 'Vizitatori', 'Checkout', 'Cumpărat']}
          rows={(summary?.countries ?? []).map(r => [r.country, r.n, r.checkout, r.purchased].map((v, i) => i === 0 ? countryLabel(String(v)) : v))} />
        <Table title="Orașe" head={['Oraș', 'Vizitatori', 'Checkout', 'Cumpărat']}
          rows={(summary?.cities ?? []).map(r => [`${r.city}, ${countryLabel(r.country)}`, r.n, r.checkout, r.purchased])} />
        <Table title="Dispozitive" head={['Dispozitiv', 'Vizitatori', 'Cumpărat']}
          rows={(summary?.devices ?? []).map(r => [r.device, r.n, r.purchased])} />
        <Table title="Browsere" head={['Browser', 'Vizitatori', 'Cumpărat']}
          rows={(summary?.browsers ?? []).map(r => [r.browser, r.n, r.purchased])} />
        <div className="md:col-span-2">
          <Table title="Pagini cele mai vizitate" head={['Pagină', 'Vizualizări', 'Vizitatori']}
            rows={(summary?.pages ?? []).map(r => [pageLabel(r.path), r.views, r.visitors])} />
        </div>
      </div>
    </div>
  )
}

function countryLabel(c: string) { return countryName(c) }
