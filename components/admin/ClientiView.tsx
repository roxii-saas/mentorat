import Link from 'next/link'
import ResendEmailBtn from '@/components/admin/ResendEmailBtn'
import ProductTabs, { type ProductStat } from '@/components/admin/ProductTabs'
import { PRODUCT_COLORS, bucharestDay, money, nf, productLabel, shortDay } from '@/lib/admin-analytics'

export type ClientRow = {
  id: string; name: string | null; email: string; phone: string | null
  amount: number | null; currency: string | null; created_at: string; product_id: string | null; bump_included: boolean | null
}

export const PAGE_SIZE = 25

// Parte grafică della pagina Clienți (la pagina carica i dati, qui si mostrano)
export default function ClientiView({ purchases, total, page, q, products, active, allSales, allRevenue }: {
  purchases: ClientRow[]; total: number; page: number; q: string
  products: ProductStat[]; active: ProductStat | null; allSales: number; allRevenue: Record<string, number>
}) {
  const colorOf = new Map(products.map((p, i) => [p.id, { p, c: PRODUCT_COLORS[i % PRODUCT_COLORS.length] }]))
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const word = active?.kind === 'mentorat' ? 'rezervări' : 'vânzări'
  const link = (n: number) => {
    const u = new URLSearchParams({ ...(active ? { p: active.slug } : {}), ...(q ? { q } : {}), ...(n > 1 ? { page: String(n) } : {}) }).toString()
    return u ? `/admin/clienti?${u}` : '/admin/clienti'
  }

  return (
    <div className="flex flex-col gap-5 sm:gap-6">
      <div>
        <h1 className="text-[26px] sm:text-[28px] leading-[34px] sm:leading-9 font-bold tracking-[-0.01em] db-title">Clienți</h1>
        <p className="text-sm sm:text-[15px] leading-6 db-muted">{nf(total)} {word} {q || active ? 'găsite' : 'înregistrate'}{active ? ` · ${productLabel(active)}` : ''}</p>
      </div>

      <ProductTabs products={products} active={active?.slug ?? ''} basePath="/admin/clienti"
        allSales={allSales} allRevenue={allRevenue} keep={q ? { q } : undefined} />

      <section aria-label="Lista clienților" className="g-card overflow-hidden">
        <div className="px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg leading-[26px] font-semibold db-title">Lista completă</h2>
          <form method="get" action="/admin/clienti" className="flex gap-2 w-full sm:w-auto">
            {active && <input type="hidden" name="p" value={active.slug} />}
            <label htmlFor="cauta" className="sr-only">Caută client</label>
            <input id="cauta" name="q" defaultValue={q} placeholder="Caută nume sau email" className="g-input sm:w-72" />
            <button type="submit" className="g-btn g-btn-md flex-shrink-0">Caută</button>
          </form>
        </div>

        {/* Desktop */}
        <div className="hidden md:grid grid-cols-[minmax(170px,1.4fr)_minmax(190px,1.5fr)_130px_150px_110px_110px_92px] gap-3 px-5 py-2.5 bg-[#F6F6FA] border-y border-[#E4E4EC] text-[13px] leading-[18px] font-semibold text-[#5A5A6C]">
          <div>Clientă</div><div>Email</div><div>Telefon</div><div>Produs</div><div className="text-right">Sumă</div><div>Data</div><div />
        </div>
        {purchases.map(p => {
          const pr = p.product_id ? colorOf.get(p.product_id) : undefined
          const nm = p.name || p.email
          const prodLabel = `${pr ? productLabel(pr.p) : 'Altele'}${p.bump_included ? ' + upgrade' : ''}`
          const av = { background: pr?.c.bg ?? '#F4D3F5', color: pr?.c.fg ?? '#7A007D' }
          const ini = nm.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()
          return (
            <div key={p.id} className="border-b border-[#EEEEF4] last:border-b-0">
              <div className="hidden md:grid grid-cols-[minmax(170px,1.4fr)_minmax(190px,1.5fr)_130px_150px_110px_110px_92px] gap-3 items-center px-5 py-3 text-sm leading-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-[38px] h-[38px] flex-shrink-0 rounded-full flex items-center justify-center font-bold text-[13px]" style={av}>{ini}</div>
                  <div className="font-semibold truncate">{p.name || '—'}</div>
                </div>
                <div className="text-[#34343F] truncate">{p.email}</div>
                <div className="text-[#34343F] tnum">
                  {p.phone ? <a href={`tel:${p.phone}`} className="hover:text-[#8A008D] hover:underline">{p.phone}</a> : <span className="text-[#6C6C80]">—</span>}
                </div>
                <div><span className="inline-block px-2.5 py-0.5 rounded-full text-xs leading-[18px] font-semibold" style={av}>{prodLabel}</span></div>
                <div className="text-right font-bold tnum">{money(p.amount ?? 0, p.currency ?? 'eur')}</div>
                <div className="text-[#5A5A6C]">{shortDay(bucharestDay(p.created_at))} {p.created_at.slice(0, 4)}</div>
                <div><ResendEmailBtn purchaseId={p.id} email={p.email} /></div>
              </div>

              {/* Mobil */}
              <div className="md:hidden flex items-start gap-3 px-4 py-4">
                <div className="w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center font-bold text-[13px]" style={av}>{ini}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[15px] leading-[22px] font-semibold truncate">{p.name || '—'}</p>
                    <span className="text-sm leading-5 font-bold tnum flex-shrink-0">{money(p.amount ?? 0, p.currency ?? 'eur')}</span>
                  </div>
                  <p className="text-[13px] leading-[18px] text-[#5A5A6C] truncate">{p.email}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-2">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs leading-[18px] font-semibold" style={av}>{prodLabel}</span>
                    <span className="text-[13px] text-[#5A5A6C]">{shortDay(bucharestDay(p.created_at))} {p.created_at.slice(0, 4)}</span>
                    {p.phone && <a href={`tel:${p.phone}`} className="text-[13px] text-[#8A008D] font-medium tnum">{p.phone}</a>}
                    <ResendEmailBtn purchaseId={p.id} email={p.email} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {purchases.length === 0 && (
          <div className="text-center py-12 px-4 text-sm db-muted">{q ? `Niciun rezultat pentru „${q}”.` : 'Nicio înregistrare încă.'}</div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 bg-[#F6F6FA] border-t border-[#E4E4EC] text-sm leading-5 text-[#5A5A6C]">
            <span>Arăt {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} din {nf(total)}</span>
            <span className="flex gap-2">
              {page > 1 ? <Link href={link(page - 1)} className="g-btn-ghost px-3.5 py-2 text-sm">Înapoi</Link> : <span className="px-3.5 py-2 text-[#6C6C80]">Înapoi</span>}
              {page < pages ? <Link href={link(page + 1)} className="g-btn-ghost px-3.5 py-2 text-sm">Înainte</Link> : <span className="px-3.5 py-2 text-[#6C6C80]">Înainte</span>}
            </span>
          </div>
        )}
      </section>
    </div>
  )
}
