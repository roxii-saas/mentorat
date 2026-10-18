import type { Metadata } from 'next'
import ThankYou from '@/components/shop/ThankYou'

export const metadata: Metadata = { title: 'Mulțumim! — Roxii Dincă', robots: { index: false } }

export default function Page({ searchParams }: PageProps<'/prompturi/multumim'>) {
  return <ThankYou slug="prompturi" searchParams={searchParams} />
}
