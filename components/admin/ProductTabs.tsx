import Link from 'next/link'
import { money, nf, productLabel } from '@/lib/admin-analytics'

export type ProductStat = {
  id: string; slug: string; name: string; kind: string; currency: string; sales_active: boolean
  sales: number; revenue: number
}

// Selettore prodotto (server component): "Toate" + un riquadro per prodotto con vendite e incassi di sempre.
// I link cambiano ?p=<slug>; active = '' significa tutti.
export default function ProductTabs({ products, active, basePath, allSales, allRevenue, keep }: {
  products: ProductStat[]; active: string; basePath: string
  allSales: number; allRevenue: Record<string, number>
  keep?: Record<string, string>   // altri parametri da mantenere nel link (es. ricerca)
}) {
  if (products.length < 2) return null
  const href = (slug: string) => {
    const q = new URLSearchParams({ ...(keep ?? {}), ...(slug ? { p: slug } : {}) }).toString()
    return q ? `${basePath}?${q}` : basePath
  }
  const allRev = Object.entries(allRevenue).filter(([, v]) => v > 0).map(([c, v]) => money(v, c)).join(' + ') || '0'
  const tiles = [
    { key: '', label: 'Toate produsele', sales: allSales, rev: allRev },
    ...products.map(p => ({ key: p.slug, label: productLabel(p), sales: p.sales, rev: money(p.revenue, p.currency) })),
  ]
  return (
    <nav aria-label="Produs" className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3 sm:gap-4">
      {tiles.map((t, i) => {
        const on = t.key === active
        return (
          <Link key={t.key || 'all'} href={href(t.key)} scroll={false} aria-current={on ? 'page' : undefined}
            className={`g-card block px-4 sm:px-[18px] py-4 transition-colors ${i === 0 ? 'col-span-2 sm:col-span-1' : ''} ${on ? '!border-[#B800BA] ring-1 ring-[#B800BA]' : 'hover:bg-[#FAFAFD]'}`}>
            <div className={`text-[13px] leading-[18px] font-semibold ${on ? 'text-[#8A008D]' : 'text-[#5A5A6C]'}`}>{t.label}</div>
            <div className="text-[26px] leading-[34px] font-bold tnum text-[#15151C] mt-0.5">{nf(t.sales)}</div>
            <div className="text-[13px] leading-5 text-[#5A5A6C]">{t.rev}</div>
          </Link>
        )
      })}
    </nav>
  )
}
