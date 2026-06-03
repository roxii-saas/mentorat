// @ts-nocheck — file Deno, non compilato da tsc. Gli errori IDE sono falsi positivi.
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://mentorat.roxii-dinca.com'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Roxana Dinca <noreply@roxii-dinca.com>'
// ⬇️ Per cambiare l'email admin: npx supabase secrets set ADMIN_NOTIFICATION_EMAIL=nuova@email.com
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'roxiiprogramari@gmail.com'

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
    const { email, name, userId, password, amount, currency, phone } = await req.json()

    if (!email || !userId) {
      return new Response(JSON.stringify({ error: 'email e userId richiesti' }), { status: 400 })
    }

    const displayName = name || email.split('@')[0]
    const priceStr = amount && currency ? `${amount} ${currency.toUpperCase()}` : 'N/D'
    const now = new Date().toLocaleString('ro-RO', {
      timeZone: 'Europe/Bucharest', dateStyle: 'full', timeStyle: 'short',
    })

    // Helper per inviare email via Resend
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
    // 1. EMAIL DI BENVENUTO AL CLIENTE
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

    <div style="background:linear-gradient(135deg,#ED03E9,#6B00E8);padding:40px 32px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:.15em;text-transform:uppercase;">Mentorat cu Roxana</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">Bun venit! Contul tău este gata 🎉</h1>
    </div>

    <div style="padding:36px 32px;">
      <p style="margin:0 0 16px;font-size:17px;color:#0A0A0A;line-height:1.6;">
        Bună, <strong>${displayName}</strong>!
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#3D3D3D;line-height:1.7;">
        Felicitări! Plata a fost confirmată și contul tău a fost creat automat.
        Mai jos găsești datele de acces — te recomandăm să-ți schimbi parola după primul login.
      </p>

      <!-- Credentials box -->
      <div style="background:#F3EEFF;border:1.5px solid rgba(237,3,233,0.25);border-radius:16px;padding:24px;margin:0 0 28px;">
        <p style="margin:0 0 16px;font-size:12px;font-weight:700;color:#B800BA;text-transform:uppercase;letter-spacing:.12em;">🔑 Datele tale de acces</p>
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:8px 0;font-size:13px;font-weight:600;color:#737373;width:80px;">Email</td>
            <td style="padding:8px 0;font-size:14px;color:#0A0A0A;">${email}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;font-size:13px;font-weight:600;color:#737373;">Parolă</td>
            <td style="padding:8px 0;">
              <code style="background:#fff;border:1.5px solid rgba(237,3,233,0.2);padding:6px 12px;border-radius:8px;font-size:15px;font-weight:700;color:#ED03E9;letter-spacing:.05em;">${password || '(a se seta la primul login)'}</code>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:0 0 28px;">
        <a href="${SITE_URL}/login"
          style="display:inline-block;background:linear-gradient(135deg,#ED03E9,#6B00E8);color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:12px;font-weight:700;font-size:16px;letter-spacing:.02em;">
          Intră în platformă →
        </a>
      </div>

      <!-- Steps -->
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#0A0A0A;text-transform:uppercase;letter-spacing:.1em;">Ce urmează:</p>
      <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
        ${[
          ['1', 'Intră în cont', 'Folosește email-ul și parola de mai sus'],
          ['2', 'Schimbă parola', 'Din Dashboard → Profil → Schimbă parola'],
          ['3', 'Programează sesiunea', 'Alege un slot liber din calendarul Roxanei'],
        ].map(([n, title, desc]) => `
          <tr>
            <td style="width:32px;vertical-align:top;padding-top:2px;">
              <div style="width:24px;height:24px;background:linear-gradient(135deg,#ED03E9,#6B00E8);border-radius:50%;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">${n}</div>
            </td>
            <td style="padding-left:12px;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#0A0A0A;">${title}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#737373;">${desc}</p>
            </td>
          </tr>
        `).join('')}
      </table>

      <p style="margin:28px 0 0;font-size:13px;color:#ABABAB;line-height:1.6;">
        Dacă ai întrebări, scrie-ne la
        <a href="mailto:roxana@roxii-dinca.com" style="color:#ED03E9;">roxana@roxii-dinca.com</a>.
      </p>
    </div>

    <div style="background:#F3EEFF;padding:20px 32px;text-align:center;border-top:1px solid rgba(237,3,233,0.1);">
      <p style="margin:0;font-size:12px;color:#B800BA;font-weight:600;">Cu drag, Roxana 💜</p>
      <p style="margin:4px 0 0;font-size:11px;color:#ABABAB;">© ${new Date().getFullYear()} Mentorat cu Roxana · Toate drepturile rezervate</p>
    </div>
  </div>
</body>
</html>`

    const clientResult = await sendEmail(
      email,
      '🎉 Bun venit în Mentorat — Datele tale de acces',
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
    <div style="background:linear-gradient(135deg,#ED03E9,#6B00E8);padding:28px 28px 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:.15em;text-transform:uppercase;">Admin · Mentorat cu Roxana</p>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">💰 Vânzare nouă!</h1>
    </div>
    <div style="padding:28px;">
      <p style="margin:0 0 20px;font-size:15px;color:#3D3D3D;line-height:1.6;">
        Cineva tocmai a cumpărat programul de mentorat. Detalii mai jos:
      </p>
      <div style="background:#F3EEFF;border:1.5px solid rgba(237,3,233,0.2);border-radius:14px;padding:20px;margin:0 0 20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#737373;width:100px;">Clientă</td>
            <td style="padding:6px 0;font-size:14px;font-weight:700;color:#0A0A0A;">${displayName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#737373;">Email</td>
            <td style="padding:6px 0;font-size:14px;color:#0A0A0A;">${email}</td>
          </tr>
          ${phone ? `<tr>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#737373;">Telefon</td>
            <td style="padding:6px 0;font-size:14px;"><a href="tel:${phone}" style="color:#ED03E9;text-decoration:none;">${phone}</a></td>
          </tr>` : ''}
          <tr>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#737373;">Sumă</td>
            <td style="padding:6px 0;font-size:16px;font-weight:800;color:#ED03E9;">${priceStr}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#737373;">Data</td>
            <td style="padding:6px 0;font-size:13px;color:#3D3D3D;">${now}</td>
          </tr>
        </table>
      </div>
      <div style="text-align:center;">
        <a href="${SITE_URL}/admin/clienti"
          style="display:inline-block;background:linear-gradient(135deg,#ED03E9,#6B00E8);color:#fff;text-decoration:none;padding:13px 28px;border-radius:12px;font-weight:700;font-size:14px;">
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
      `💰 Vânzare nouă — ${displayName} (${priceStr})`,
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
