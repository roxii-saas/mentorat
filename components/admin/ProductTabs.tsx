import Link from 'next/link'

export type ProductStat = {
  id: string; slug: string; name: string; kind: string; currency: string; sales_active: boolean
  sales: number; revenue: number
}

// Selettore prodotto (server component): i link cambiano ?p=<slug>
export default function ProductTabs({ products, active, basePath }: {
  products: ProductStat[]; active: string; basePath: string
}) {
  if (products.length < 2) return null
  return (
    <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-2 sm:gap-3">
      {products.map(p => {
        const on = p.slug === active
        return (
          <Link key={p.id} href={`${basePath}?p=${p.slug}`} scroll={false}
            className={`g-card rounded-2xl p-3.5 sm:p-4 transition-all ${on ? 'ring-2 ring-[#ED03E9] shadow-md' : 'opacity-75 hover:opacity-100'}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold font-sans uppercase tracking-wider db-muted">
                {p.kind === 'mentorat' ? 'Mentorat' : 'Produs digital'}
              </span>
              {on && <span className="w-1.5 h-1.5 rounded-full bg-[#ED03E9]" />}
            </div>
            <p className="text-sm font-semibold db-text font-sans truncate mt-0.5">/{p.slug}</p>
            <p className="font-serif font-bold text-lg sm:text-xl mt-1" style={{ color: on ? '#ED03E9' : undefined }}>
              {p.revenue.toLocaleString('ro-RO')} {p.currency.toUpperCase()}
            </p>
            <p className="text-xs db-muted font-sans">{p.sales} {p.kind === 'mentorat' ? 'rezervări' : 'vânzări'}</p>
          </Link>
        )
      })}
    </div>
  )
}
