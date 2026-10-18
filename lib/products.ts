import { createClient } from '@supabase/supabase-js'
import { unstable_cache } from 'next/cache'

export const PRODUCTS_TAG = 'products'
export const PRODUCT_FILES_BUCKET = 'product-files'

export type Product = {
  id: string
  slug: string
  name: string
  kind: 'mentorat' | 'digital'
  price_amount: number
  compare_price: number | null
  currency: string
  sales_active: boolean
  bump_active: boolean
  bump_name: string | null
  bump_description: string | null
  bump_price: number | null
  file_path: string | null
  bump_file_path: string | null
  email_subject: string | null
  email_body: string | null
  cover_url: string | null
  landing: Landing | null
  promo_type: 'price' | 'percent' | null
  promo_value: number | null
  promo_starts_at: string | null
  promo_ends_at: string | null
  notify_admin?: boolean   // lipsește până la aplicarea migrării → tratat ca activ
  notify_copy?: boolean
  notify_emails?: string | null
}

// Conținutul paginii dedicate (editabil din admin). Orice câmp lipsă primește o valoare implicită în normalizeLanding.
export type Landing = {
  eyebrow?: string; headline?: string; subheadline?: string; badge?: string
  benefits?: { title: string; text: string }[]
  inside?: string[]
  faq?: { q: string; a: string }[]
  guarantee?: string
  cta_title?: string; cta_text?: string
  // checkout
  checkout_eyebrow?: string; checkout_text?: string; checkout_badge?: string; checkout_note?: string; format?: string
}

// Default usati se Supabase non risponde (la landing esce comunque)
export const PRODUCT_DEFAULTS: Record<string, Partial<Product>> = {
  prompturi: {
    slug: 'prompturi',
    name: 'Pachet Complet 50+ Prompturi AI Poziții Beauty, Fashion & Lifestyle',
    kind: 'digital',
    price_amount: 149,
    compare_price: 399,
    currency: 'ron',
    sales_active: true,
    bump_active: true,
    bump_name: 'Ghidul Video: Cum generezi imagini ultra-realiste fără aspect de plastic',
    bump_description: 'Tehnici avansate pas-cu-pas de texturare fină a pielii, control cinematic al luminilor și trucuri pentru evitarea artefactelor specifice AI.',
    bump_price: 49,
    cover_url: '/prompturi/cover.jpg',
    landing: {
      checkout_eyebrow: 'Ediție limitată digitală',
      checkout_text: 'Primești instant colecția de 50+ prompturi AI și începi să creezi ședințe foto virtuale impecabile.',
      checkout_badge: 'Ghid premium + bonusuri',
      checkout_note: 'Include 3 bonusuri exclusive',
      format: 'PDF digital',
      guarantee: 'Dacă nu obții imagini spectaculoase folosind prompturile și indicațiile din ghid, scrie-ne în termen de 14 zile și primești toți banii înapoi, fără întrebări.',
    },
  },
}

// Colonne pubbliche (mai file_path / email nella landing)
const PUBLIC_COLUMNS = 'id, slug, name, kind, price_amount, compare_price, currency, sales_active, bump_active, bump_name, bump_description, bump_price, cover_url, landing, promo_type, promo_value, promo_starts_at, promo_ends_at'
const LEGACY_COLUMNS = 'id, slug, name, kind, price_amount, compare_price, currency, sales_active, bump_active, bump_name, bump_description, bump_price'
export type PublicProduct = Pick<Product, 'id' | 'slug' | 'name' | 'kind' | 'price_amount' | 'compare_price' | 'currency' | 'sales_active' | 'bump_active' | 'bump_name' | 'bump_description' | 'bump_price' | 'cover_url' | 'landing' | 'promo_type' | 'promo_value' | 'promo_starts_at' | 'promo_ends_at'>

const fetchProduct = unstable_cache(
  async (slug: string) => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: { persistSession: false, autoRefreshToken: false },
        global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(2500) }) },
      }
    )
    let { data, error } = await supabase.from('products').select(PUBLIC_COLUMNS).eq('slug', slug).maybeSingle()
    if (error) {
      // Migrarea cu coloanele paginii (cover_url, landing) nu e încă aplicată → citește coloanele vechi, prețul rămâne cel din baza de date
      const legacy = await supabase.from('products').select(LEGACY_COLUMNS).eq('slug', slug).maybeSingle()
      if (legacy.error) throw legacy.error
      data = legacy.data ? { ...legacy.data, cover_url: PRODUCT_DEFAULTS[slug]?.cover_url ?? null, landing: PRODUCT_DEFAULTS[slug]?.landing ?? null, promo_type: null, promo_value: null, promo_starts_at: null, promo_ends_at: null } : null
    }
    return (data as PublicProduct | null) ?? null
  },
  ['product'],
  { tags: [PRODUCTS_TAG], revalidate: 60 }
)

export async function getPublicProduct(slug: string): Promise<PublicProduct> {
  try {
    const p = await fetchProduct(slug)
    if (p) return p
  } catch {}
  return { id: '', ...PRODUCT_DEFAULTS[slug] } as PublicProduct
}

// Pentru paginile dinamice /<slug>: null = produsul nu există (→ 404). Dacă baza de date nu răspunde, doar produsele cunoscute au valori implicite.
export async function findPublicProduct(slug: string): Promise<PublicProduct | null> {
  try {
    const p = await fetchProduct(slug)
    return p && p.kind === 'digital' ? p : null
  } catch {
    return PRODUCT_DEFAULTS[slug] ? ({ id: '', ...PRODUCT_DEFAULTS[slug] } as PublicProduct) : null
  }
}

export function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString('ro-RO')} ${currency.toUpperCase()}`
}
