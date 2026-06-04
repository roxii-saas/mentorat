import { createClient } from '@/lib/supabase/server'
import LandingClient from '@/components/landing/LandingClient'

export default async function LandingPage() {
  // Fetch settings server-side → nessun flash, prezzo già disponibile al render
  const supabase = await createClient()
  const { data: settings } = await supabase
    .from('platform_settings')
    .select('price_amount, currency, product_name, sales_active, comparison_price, cta_text, cta_show_price, secondary_cta_text, cta_badge_text, hero_image_url, mentor_image_url')
    .single()

  const initialSettings = {
    price_amount: settings?.price_amount ?? 297,
    currency: settings?.currency ?? 'eur',
    product_name: settings?.product_name ?? 'Mentorat Premium cu Roxana',
    sales_active: settings?.sales_active ?? true,
    comparison_price: settings?.comparison_price ?? 1376,
    cta_text: settings?.cta_text ?? 'Vreau să mă transform',
    cta_show_price: settings?.cta_show_price ?? true,
    secondary_cta_text: settings?.secondary_cta_text ?? 'Cum funcționează',
    cta_badge_text: settings?.cta_badge_text ?? 'Mentorat exclusiv · Locuri limitate',
    hero_image_url: settings?.hero_image_url ?? null,
    mentor_image_url: settings?.mentor_image_url ?? null,
  }

  return <LandingClient initialSettings={initialSettings} />
}
