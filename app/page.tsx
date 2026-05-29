import { createClient } from '@/lib/supabase/server'
import LandingClient from '@/components/landing/LandingClient'

export default async function LandingPage() {
  // Fetch settings server-side → nessun flash, prezzo già disponibile al render
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('price_amount, currency, product_name, sales_active')
    .single()

  const initialSettings = settings ?? {
    price_amount: 297,
    currency: 'eur',
    product_name: 'Mentorat Premium cu Roxana',
    sales_active: true,
  }

  return <LandingClient initialSettings={initialSettings} />
}
