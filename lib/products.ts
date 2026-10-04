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
  },
}

// Colonne pubbliche (mai file_path / email nella landing)
const PUBLIC_COLUMNS = 'id, slug, name, kind, price_amount, compare_price, currency, sales_active, bump_active, bump_name, bump_description, bump_price'
export type PublicProduct = Pick<Product, 'id' | 'slug' | 'name' | 'kind' | 'price_amount' | 'compare_price' | 'currency' | 'sales_active' | 'bump_active' | 'bump_name' | 'bump_description' | 'bump_price'>

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
    const { data, error } = await supabase.from('products').select(PUBLIC_COLUMNS).eq('slug', slug).single()
    if (error) throw error
    return data as PublicProduct
  },
  ['product'],
  { tags: [PRODUCTS_TAG], revalidate: 300 }
)

export async function getPublicProduct(slug: string): Promise<PublicProduct> {
  try {
    return await fetchProduct(slug)
  } catch {
    return { id: '', ...PRODUCT_DEFAULTS[slug] } as PublicProduct
  }
}

export function formatMoney(amount: number, currency: string) {
  return `${amount.toLocaleString('ro-RO')} ${currency.toUpperCase()}`
}
