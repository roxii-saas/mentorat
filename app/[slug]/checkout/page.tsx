import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { findPublicProduct } from '@/lib/products'
import { SLUG_RE } from '@/lib/product-slug'
import CheckoutForm from '@/components/prompturi/CheckoutForm'

export const revalidate = 300
export const metadata: Metadata = { title: 'Checkout securizat — Roxii Dincă', robots: { index: false } }

export default async function ProductCheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!SLUG_RE.test(slug)) notFound()
  const product = await findPublicProduct(slug)
  if (!product) notFound()
  return <CheckoutForm product={product} />
}
