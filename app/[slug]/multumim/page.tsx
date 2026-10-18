import type { Metadata } from 'next'
import ThankYou from '@/components/shop/ThankYou'

export const metadata: Metadata = { title: 'Mulțumim! — Roxii Dincă', robots: { index: false } }

export default async function Page({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { slug } = await params
  return <ThankYou slug={slug} searchParams={searchParams} />
}
