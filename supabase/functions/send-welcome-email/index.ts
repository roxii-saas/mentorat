// @ts-nocheck — file Deno, non compilato da tsc. Gli errori IDE sono falsi positivi.
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://mentorat.roxii-dinca.com'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Roxana Dinca <noreply@roxii-dinca.com>'
// ⬇️ Per cambiare: npx supabase secrets set ADMIN_NOTIFICATION_EMAIL=nuova@email.com
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'roxiiprogramari@gmail.com'

const LOGO_URL = `${SITE_URL}/logo.png`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { email, name, userId, amount, currency, phone } = await req.json()

    if (!email || !userId) {
      return new Response(JSON.stringify({ error: 'email e userId richiesti' }), { status: 400 })
    }

    const displayName = name || email.split('@')[0]
    const priceStr = amount && currency ? `${amount} ${currency.toUpperCase()}` : 'N/D'
    const now = new Date().toLocaleString('ro-RO', {
      timeZone: 'Europe/Bucharest', dateStyle: 'full', timeStyle: 'short',
    })

    const sendEmail = async (to, subject, html) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
      })
      const data = await res.json()
      if (!res.ok) console.error(`Resend error (${to}):`, data)
      else console.log(`Email inviata a ${to} — id:`, data.id)
      return { ok: res.ok, data }
    }

    // ──────────────────────────────────────────
    // 1. EMAIL DI RINGRAZIAMENTO AL CLIENTE
    // ──────────────────────────────────────────
    const clientHtml = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F3EEFF;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(107,0,232,0.10);">

    <!-- Header gradient cu logo -->
    <div style="background:linear-gradient(135deg,#ED03E9,#6B00E8);padding:36px 32px 32px;text-align:center;">
      <img src="${LOGO_URL}" alt="Mentorat cu Roxana"
        style="height:52px;width:auto;object-fit:contain;filter:brightness(0) invert(1);margin-bottom:20px;display:block;margin-left:auto;margin-right:auto;" />
      <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.25;">
        Îți mulțumim pentru rezervare! 🎉
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;">

      <p style="margin:0 0 18px;font-size:17px;color:#0A0A0A;line-height:1.6;">
        Bună, <strong>${displayName}</strong>!
      </p>

      <p style="margin:0 0 16px;font-size:15px;color:#3D3D3D;line-height:1.75;">
        Rezervarea ta a fost confirmată cu succes. Ești cu un pas mai aproape de a-ți transforma afacerea online și de a ajunge la <strong style="color:#0A0A0A;">3.000€/lună</strong>.
      </p>

      <!-- Highlight box -->
      <div style="background:#F3EEFF;border-left:4px solid #ED03E9;border-radius:0 12px 12px 0;padding:20px 24px;margin:24px 0;">
        <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#B800BA;text-transform:uppercase;letter-spacing:.1em;">Ce urmează</p>
        <p style="margin:0;font-size:15px;color:#3D3D3D;line-height:1.7;">
          Roxana te va contacta în curând pentru a stabili pașii următori în programul de Mentorat și pentru a programa prima ta sesiune 1:1.
        </p>
      </div>

      <!-- Steps -->
      <table style="width:100%;border-collapse:separate;border-spacing:0 10px;margin:8px 0 24px;">
        ${[
          ['📞', 'Vei fi contactată de Roxana', 'Pe email sau telefon, pentru a stabili împreună pașii următori.'],
          ['📅', 'Programați prima sesiune', 'O sesiune 1:1 de 60 de minute, dedicată situației tale concrete.'],
          ['🚀', 'Primești strategia personalizată', 'Un plan clar și acționabil pentru a ajunge la 3.000€/lună.'],
        ].map(([emoji, title, desc]) => `
          <tr>
            <td style="width:40px;vertical-align:top;font-size:22px;padding-top:2px;">${emoji}</td>
            <td style="padding-left:12px;">
              <p style="margin:0 0 2px;font-size:14px;font-weight:700;color:#0A0A0A;">${title}</p>
              <p style="margin:0;font-size:13px;color:#737373;line-height:1.5;">${desc}</p>
            </td>
          </tr>
        `).join('')}
      </table>

      <p style="margin:0 0 28px;font-size:14px;color:#3D3D3D;line-height:1.7;">
        Dacă ai întrebări înainte ca Roxana să te contacteze, scrie-ne oricând la
        <a href="mailto:roxana@roxii-dinca.com" style="color:#ED03E9;text-decoration:none;font-weight:600;">roxana@roxii-dinca.com</a>.
      </p>

      <p style="margin:0;font-size:15px;color:#0A0A0A;line-height:1.6;">
        Cu drag,<br/>
        <strong>Roxana Dinca</strong><br/>
        <span style="font-size:13px;color:#737373;">Mentor & Coach Business Online</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F3EEFF;padding:20px 32px;text-align:center;border-top:1px solid rgba(237,3,233,0.1);">
      <img src="${LOGO_URL}" alt="Mentorat cu Roxana"
        style="height:32px;width:auto;object-fit:contain;margin-bottom:8px;display:block;margin-left:auto;margin-right:auto;" />
      <p style="margin:0;font-size:11px;color:#ABABAB;">© ${new Date().getFullYear()} Mentorat cu Roxana · Toate drepturile rezervate</p>
    </div>
  </div>
</body>
</html>`

    const clientResult = await sendEmail(
      email,
      '🎉 Rezervarea ta este confirmată — Mentorat cu Roxana',
      clientHtml
    )
    if (!clientResult.ok) {
      return new Response(JSON.stringify({ error: 'Email cliente non inviata', details: clientResult.data }), { status: 500 })
    }

    // ──────────────────────────────────────────
    // 2. NOTIFICA ADMIN
    // ──────────────────────────────────────────
    const adminHtml = `
<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3EEFF;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:540px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(107,0,232,0.10);">

    <!-- Header cu logo -->
    <div style="background:linear-gradient(135deg,#ED03E9,#6B00E8);padding:28px 28px 24px;text-align:center;">
      <img src="${LOGO_URL}" alt="Mentorat cu Roxana"
        style="height:44px;width:auto;object-fit:contain;filter:brightness(0) invert(1);margin-bottom:14px;display:block;margin-left:auto;margin-right:auto;" />
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:.15em;text-transform:uppercase;">Admin · Notificare</p>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">💰 Rezervare nouă!</h1>
    </div>

    <div style="padding:28px;">
      <p style="margin:0 0 20px;font-size:15px;color:#3D3D3D;line-height:1.6;">
        O nouă rezervare a fost finalizată cu succes. Contacteaz-o pe clientă pentru a stabili pașii următori.
      </p>

      <!-- Client info -->
      <div style="background:#F3EEFF;border:1.5px solid rgba(237,3,233,0.2);border-radius:14px;padding:20px;margin:0 0 20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:7px 0;font-size:13px;font-weight:600;color:#737373;width:100px;">Clientă</td>
            <td style="padding:7px 0;font-size:15px;font-weight:700;color:#0A0A0A;">${displayName}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;font-weight:600;color:#737373;">Email</td>
            <td style="padding:7px 0;font-size:14px;color:#0A0A0A;">
              <a href="mailto:${email}" style="color:#ED03E9;text-decoration:none;">${email}</a>
            </td>
          </tr>
          ${phone ? `<tr>
            <td style="padding:7px 0;font-size:13px;font-weight:600;color:#737373;">Telefon</td>
            <td style="padding:7px 0;font-size:14px;">
              <a href="tel:${phone}" style="color:#ED03E9;text-decoration:none;">${phone}</a>
            </td>
          </tr>` : ''}
          <tr>
            <td style="padding:7px 0;font-size:13px;font-weight:600;color:#737373;">Sumă</td>
            <td style="padding:7px 0;font-size:18px;font-weight:800;color:#ED03E9;">${priceStr}</td>
          </tr>
          <tr>
            <td style="padding:7px 0;font-size:13px;font-weight:600;color:#737373;">Data</td>
            <td style="padding:7px 0;font-size:13px;color:#3D3D3D;">${now}</td>
          </tr>
        </table>
      </div>

      <div style="text-align:center;">
        <a href="${SITE_URL}/admin/clienti"
          style="display:inline-block;background:linear-gradient(135deg,#ED03E9,#6B00E8);color:#fff;text-decoration:none;padding:13px 32px;border-radius:12px;font-weight:700;font-size:14px;">
          Deschide panoul de admin →
        </a>
      </div>

      <p style="margin:20px 0 0;font-size:12px;color:#ABABAB;text-align:center;">
        Notificare automată · Mentorat cu Roxana
      </p>
    </div>
  </div>
</body>
</html>`

    await sendEmail(
      ADMIN_EMAIL,
      `💰 Rezervare nouă — ${displayName} (${priceStr})`,
      adminHtml
    )

    return new Response(JSON.stringify({ ok: true, emailId: clientResult.data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Edge function error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
