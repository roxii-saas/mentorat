import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

export const SETTINGS_TAG = 'platform-settings'

const DEFAULTS = {
  price_amount: 297,
  currency: 'eur',
  product_name: 'Mentorat Premium cu Roxana',
  sales_active: true,
  comparison_price: 1376,
  cta_text: 'Vreau să mă transform',
  cta_show_price: true,
  secondary_cta_text: 'Cum funcționează',
  cta_badge_text: 'Mentorat exclusiv · Locuri limitate',
  header_cta_text: 'Cumpără',
  header_cta_show_price: true,
  instagram_url: '',
  instagram_visible: true,
  facebook_url: '',
  facebook_visible: true,
  hero_image_url: null as string | null,
  mentor_image_url: null as string | null,
}

export type LandingSettings = typeof DEFAULTS

// Client senza cookie (dati pubblici) → la pagina può essere cacheata.
// Timeout breve: se Supabase non risponde, la pagina esce comunque coi default.
const fetchSettings = unstable_cache(
  async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(2500) }) },
      }
    )
    const { data, error } = await supabase
      .from('platform_settings')
      .select(Object.keys(DEFAULTS).join(', '))
      .single()
    // Throw → unstable_cache non memorizza il fallimento
    if (error) throw error
    return data as unknown as Partial<LandingSettings>
  },
  ['landing-settings'],
  { tags: [SETTINGS_TAG], revalidate: 300 }
)

export async function getLandingSettings(): Promise<LandingSettings> {
  try {
    const data = await fetchSettings()
    const out: Record<string, unknown> = { ...DEFAULTS }
    for (const [k, v] of Object.entries(data)) if (v !== null && v !== undefined) out[k] = v
    return out as LandingSettings
  } catch {
    return DEFAULTS
  }
}
