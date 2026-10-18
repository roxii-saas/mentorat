import type { PublicProduct } from '@/lib/products'

export const DEFAULT_GUARANTEE = 'Dacă nu ești mulțumit(ă), scrie-ne în termen de 14 zile și primești toți banii înapoi, fără întrebări.'

// Valorile implicite ale paginii: un produs nou arată bine chiar dacă nu a completat nimic în admin
export function normalizeLanding(p: Pick<PublicProduct, 'name' | 'landing'>) {
  const l = p.landing ?? {}
  return {
    eyebrow: l.eyebrow?.trim() || 'Produs digital',
    headline: l.headline?.trim() || p.name,
    subheadline: l.subheadline?.trim() || '',
    badge: l.badge?.trim() || '',
    benefits: (l.benefits ?? []).filter(b => b.title?.trim()),
    inside: (l.inside ?? []).map(s => s.trim()).filter(Boolean),
    faq: (l.faq ?? []).filter(f => f.q?.trim() && f.a?.trim()),
    guarantee: l.guarantee?.trim() || DEFAULT_GUARANTEE,
    cta_title: l.cta_title?.trim() || 'Începe chiar azi',
    cta_text: l.cta_text?.trim() || 'Acces imediat după plată, direct pe email.',
    checkout_eyebrow: l.checkout_eyebrow?.trim() || 'Comandă securizată',
    checkout_text: l.checkout_text?.trim() || 'Primești produsul pe email imediat după plată.',
    checkout_badge: l.checkout_badge?.trim() || 'Produs digital',
    checkout_note: l.checkout_note?.trim() || '',
    format: l.format?.trim() || 'Descărcare digitală',
  }
}
