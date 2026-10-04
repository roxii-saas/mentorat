import { resend } from '@/lib/resend'
import { formatMoney, type Product } from '@/lib/products'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mentorat.roxii-dinca.com'
const FROM = 'Roxii Dincă <noreply@roxii-dinca.com>'
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'roxiiprogramari@gmail.com'

type DeliveryPurchase = {
  id: string
  name: string | null
  email: string
  phone?: string | null
  amount: number
  currency: string
  bump_included: boolean
}

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function button(href: string, label: string) {
  return `<a href="${href}" style="display:inline-block;background:#b90c55;color:#ffffff;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:15px 28px;border-radius:6px;">${label}</a>`
}

// Email di consegna al cliente: testo personalizzato dall'admin + link di download permanenti
export async function sendDeliveryEmail(p: DeliveryPurchase, product: Product) {
  const firstName = (p.name || p.email.split('@')[0]).split(' ')[0]
  const body = (product.email_body || 'Bună, {nume}!\n\nÎți mulțumesc pentru comandă. Găsești materialele mai jos.')
    .replaceAll('{nume}', firstName)
  const subject = (product.email_subject || `${product.name} — accesul tău`).replaceAll('{nume}', firstName)

  const paragraphs = esc(body)
    .split(/\n{2,}/)
    .map(par => `<p style="margin:0 0 16px;font-family:Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:#47464a;">${par.replace(/\n/g, '<br>')}</p>`)
    .join('')

  const links = [
    product.file_path ? button(`${SITE_URL}/descarca/${p.id}`, 'Descarcă colecția') : '',
    p.bump_included && product.bump_file_path
      ? `<div style="height:12px"></div>${button(`${SITE_URL}/descarca/${p.id}?f=bonus`, 'Descarcă ghidul video')}`
      : '',
  ].join('')

  const html = `<!DOCTYPE html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fbf9f6;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fbf9f6;padding:40px 16px;"><tr><td align="center">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e8e2d9;border-radius:8px;">
  <tr><td align="center" style="padding:32px 32px 8px;">
    <img src="${SITE_URL}/logo.png" alt="Roxii Dincă" width="120" style="display:block;height:auto;">
  </td></tr>
  <tr><td style="padding:16px 32px 0;">
    <p style="margin:0 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#b90c55;">Comanda ta este confirmată</p>
    <h1 style="margin:0 0 20px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:34px;font-weight:500;color:#1b1c1a;">${esc(product.name)}</h1>
    ${paragraphs}
  </td></tr>
  <tr><td align="center" style="padding:8px 32px 28px;">${links}</td></tr>
  <tr><td style="padding:0 32px 28px;">
    <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;color:#77767b;">Linkurile sunt personale și rămân active — salvează acest email. Total plătit: ${formatMoney(p.amount, p.currency)}.</p>
  </td></tr>
</table>
</td></tr></table></body></html>`

  return resend.emails.send({ from: FROM, to: p.email, subject, html })
}

// Notifica a Roxana per ogni vendita digitale
export async function sendAdminSaleEmail(p: DeliveryPurchase, product: Product) {
  const rows = [
    ['Produs', product.name + (p.bump_included ? ' + upgrade' : '')],
    ['Nume', p.name || '—'],
    ['Email', p.email],
    ['Telefon', p.phone || '—'],
    ['Sumă', formatMoney(p.amount, p.currency)],
  ].map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#77767b;">${k}</td><td style="padding:6px 0;color:#1b1c1a;font-weight:600;">${esc(v)}</td></tr>`).join('')

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `💸 Vânzare nouă: ${product.slug} — ${formatMoney(p.amount, p.currency)}`,
    html: `<div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;"><h2 style="font-family:Georgia,serif;font-weight:500;">Vânzare nouă</h2><table>${rows}</table></div>`,
  })
}
