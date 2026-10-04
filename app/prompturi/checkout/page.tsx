import type { Metadata } from 'next'
import { getPublicProduct } from '@/lib/products'
import CheckoutForm from '@/components/prompturi/CheckoutForm'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Checkout securizat — 50+ Prompturi AI | Roxii Dincă',
  robots: { index: false },
}

export default async function PrompturiCheckoutPage() {
  const product = await getPublicProduct('prompturi')
  return <CheckoutForm product={product} />
}
