import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('platform_settings')
    .select('*')
    .single()

  return NextResponse.json(data ?? {
    price_amount: 297,
    currency: 'eur',
    product_name: 'Mentorat Premium cu Roxana',
    product_description: '',
    sales_active: true,
  })
}
