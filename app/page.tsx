import LandingClient from '@/components/landing/LandingClient'
import MetaEvent from '@/components/meta/MetaEvent'
import { getLandingSettings } from '@/lib/settings'

// ISR: rigenera ogni 5 min (e subito quando l'admin salva) → se Supabase è giù al build non resta bloccato sui default
export const revalidate = 300

export default async function LandingPage() {
  const initialSettings = await getLandingSettings()
  return (
    <>
      <MetaEvent name="ViewContent" params={{
        content_ids: ['mentorat'], content_type: 'product',
        value: initialSettings.price_amount, currency: initialSettings.currency.toUpperCase(),
      }} />
      <LandingClient initialSettings={initialSettings} />
    </>
  )
}
