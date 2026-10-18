// Slug-ul produsului = adresa paginii lui (/slug). Nu poate intra în conflict cu paginile existente ale site-ului.
export const RESERVED_SLUGS = [
  'admin', 'api', 'checkout', 'dashboard', 'login', 'descarca', 'mentorat', 'reset-password', 'update-password',
  'politica-de-cookie', 'politica-de-confidentialitate', 'termeni-si-conditii', 'logo', 'favicon', 'robots', 'sitemap',
  'static', 'public', 'assets', 'images', 'new', 'null', 'undefined',
]
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugify(s: string) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '')
}
export function slugError(slug: string): string | null {
  if (slug.length < 3) return 'Minim 3 caractere.'
  if (slug.length > 40) return 'Maxim 40 de caractere.'
  if (!SLUG_RE.test(slug)) return 'Doar litere mici, cifre și cratime (ex: ghid-social-media).'
  if (RESERVED_SLUGS.includes(slug)) return 'Acest nume este rezervat de site.'
  return null
}
