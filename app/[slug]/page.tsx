import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findPublicProduct } from '@/lib/products'
import { SLUG_RE } from '@/lib/product-slug'
import { withCurrentPrice } from '@/lib/pricing'
import { normalizeLanding } from '@/components/shop/landing'
import ProductLanding from '@/components/shop/ProductLanding'

// ISR: rigenerează la 5 min și imediat când admin salvează produsul
export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = SLUG_RE.test(slug) ? await findPublicProduct(slug) : null
  if (!product) return { title: 'Pagină inexistentă', robots: { index: false } }
  const L = normalizeLanding(product)
  return {
    title: `${L.headline} — Roxii Dincă`,
    description: L.subheadline || undefined,
    openGraph: { title: L.headline, description: L.subheadline || undefined, siteName: 'Roxii Dincă', locale: 'ro_RO', type: 'website', ...(product.cover_url ? { images: [{ url: product.cover_url }] } : {}) },
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUG_RE.test(slug)) notFound()
  const product = await findPublicProduct(slug)
  if (!product) notFound()
  return <ProductLanding product={withCurrentPrice(product)} />
}
