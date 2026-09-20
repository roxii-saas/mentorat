import LandingClient from '@/components/landing/LandingClient'
import { getLandingSettings } from '@/lib/settings'

// ISR: rigenera ogni 5 min (e subito quando l'admin salva) → se Supabase è giù al build non resta bloccato sui default
export const revalidate = 300

export default async function LandingPage() {
  const initialSettings = await getLandingSettings()
  return <LandingClient initialSettings={initialSettings} />
}
