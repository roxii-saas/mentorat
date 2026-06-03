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
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { email, name, userId, amount, currency } = await req.json() as {
      email: string
      name?: string
      userId: string
      amount?: number
      currency?: string
    }

    if (!email || !userId) {
      return new Response(JSON.stringify({ error: 'email e userId richiesti' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Genera link di accesso one-time (recovery link)
    // L'utente cliccherà questo link e imposterà la propria password
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: `${SITE_URL}/update-password`,
      },
    })

    if (linkError) {
      console.error('generateLink error:', linkError)
      return new Response(JSON.stringify({ error: linkError.message }), { status: 500 })
    }

    const accessLink = linkData?.properties?.action_link ?? `${SITE_URL}/login`
    const displayName = name || email.split('@')[0]

    const html = `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bun venit în Mentorat</title>
</head>
<body style="margin:0;padding:0;background:#F3EEFF;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:580px;margin:40px auto;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 4px 40px rgba(107,0,232,0.10);">

    <!-- Header gradient -->
    <div style="background:linear-gradient(135deg,#ED03E9,#6B00E8);padding:40px 32px;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:.15em;text-transform:uppercase;">Mentorat cu Roxana</p>
      <h1 style="margin:0;font-size:28px;font-weight:800;color:#ffffff;line-height:1.2;">Plata confirmată! 🎉</h1>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;">
      <p style="margin:0 0 16px;font-size:17px;color:#0A0A0A;line-height:1.6;">
        Bună, <strong>${displayName}</strong>!
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#3D3D3D;line-height:1.7;">
        Felicitări! Plata ta a fost confirmată și contul tău a fost creat automat.
        Ești la un clic distanță de a-ți transforma afacerea online.
      </p>

      <!-- Access box -->
      <div style="background:#F3EEFF;border:1.5px solid rgba(237,3,233,0.2);border-radius:16px;padding:24px;margin:0 0 28px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#B800BA;text-transform:uppercase;letter-spacing:.12em;">Accesează contul tău</p>
        <p style="margin:0 0 16px;font-size:14px;color:#3D3D3D;line-height:1.6;">
          Clicca pe butonul de mai jos pentru a intra în platformă și a-ți seta parola proprie.
          Link-ul este valabil <strong>24 de ore</strong>.
        </p>
        <a href="${accessLink}"
          style="display:inline-block;background:linear-gradient(135deg,#ED03E9,#6B00E8);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:700;font-size:15px;letter-spacing:.02em;">
          Intră în platformă →
        </a>
      </div>

      <!-- Email info -->
      <div style="background:#FAFAFA;border:1px solid rgba(0,0,0,0.07);border-radius:12px;padding:16px 20px;margin:0 0 24px;">
        <p style="margin:0;font-size:13px;color:#737373;">
          <strong style="color:#0A0A0A;">Email cont:</strong> ${email}
        </p>
      </div>

      <!-- Steps -->
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#0A0A0A;text-transform:uppercase;letter-spacing:.1em;">Ce urmează:</p>
      <table style="width:100%;border-collapse:separate;border-spacing:0 8px;">
        ${[
          ['1', 'Accesează contul', 'Clicca butonul de sus și setează-ți parola proprie'],
          ['2', 'Programează sesiunea', 'Alege un slot liber din calendarul Roxanei'],
          ['3', 'Primești strategia ta', 'Sesiune 1:1 de 60 min cu plan personalizat'],
        ].map(([n, title, desc]) => `
          <tr>
            <td style="width:32px;vertical-align:top;padding-top:2px;">
              <div style="width:24px;height:24px;background:linear-gradient(135deg,#ED03E9,#6B00E8);border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;line-height:24px;font-size:12px;font-weight:700;color:#fff;">${n}</div>
            </td>
            <td style="padding-left:12px;">
              <p style="margin:0;font-size:14px;font-weight:600;color:#0A0A0A;">${title}</p>
              <p style="margin:2px 0 0;font-size:12px;color:#737373;">${desc}</p>
            </td>
          </tr>
        `).join('')}
      </table>

      <p style="margin:28px 0 0;font-size:13px;color:#ABABAB;line-height:1.6;">
        Dacă nu ai solicitat tu acest cont sau ai întrebări, scrie-ne la
        <a href="mailto:roxana@roxii-dinca.com" style="color:#ED03E9;">roxana@roxii-dinca.com</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F3EEFF;padding:20px 32px;text-align:center;border-top:1px solid rgba(237,3,233,0.1);">
      <p style="margin:0;font-size:12px;color:#B800BA;font-weight:600;">Cu drag, Roxana 💜</p>
      <p style="margin:4px 0 0;font-size:11px;color:#ABABAB;">© ${new Date().getFullYear()} Mentorat cu Roxana · Toate drepturile rezervate</p>
    </div>
  </div>
</body>
</html>`

    // Helper per inviare email via Resend
    const sendEmail = async (to: string, subject: string, htmlBody: string) => {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, html: htmlBody }),
      })
      const data = await res.json()
      if (!res.ok) console.error(`Resend error (${to}):`, data)
      else console.log(`Email inviata a ${to} — id:`, data.id)
      return { ok: res.ok, data }
    }

    // 1. Email di benvenuto al cliente
    const clientResult = await sendEmail(
      email,
      '🎉 Bun venit în Mentorat — Accesează contul tău!',
      html
    )
    if (!clientResult.ok) {
      return new Response(JSON.stringify({ error: 'Email cliente non inviata', details: clientResult.data }), { status: 500 })
    }

    // 2. Notifica all'admin
    const priceStr = amount && currency
      ? `${amount} ${currency.toUpperCase()}`
      : 'N/D'
    const now = new Date().toLocaleString('ro-RO', { timeZone: 'Europe/Bucharest', dateStyle: 'full', timeStyle: 'short' })

    const adminHtml = `
<!DOCTYPE html>
<html lang="ro">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3EEFF;font-family:'Inter',system-ui,sans-serif;">
  <div style="max-width:540px;margin:32px auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 32px rgba(107,0,232,0.10);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#ED03E9,#6B00E8);padding:28px 28px 24px;text-align:center;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.7);letter-spacing:.15em;text-transform:uppercase;">Admin · Mentorat cu Roxana</p>
      <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">💰 Vânzare nouă!</h1>
    </div>

    <!-- Body -->
    <div style="padding:28px;">
      <p style="margin:0 0 20px;font-size:15px;color:#3D3D3D;line-height:1.6;">
        Cineva tocmai a cumpărat programul de mentorat. Detalii mai jos:
      </p>

      <!-- Client info -->
      <div style="background:#F3EEFF;border:1.5px solid rgba(237,3,233,0.2);border-radius:14px;padding:20px;margin:0 0 20px;">
        <table style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#737373;width:120px;">Clientă</td>
            <td style="padding:6px 0;font-size:14px;font-weight:700;color:#0A0A0A;">${displayName}</td>
          </tr>
          <tr>
            <td style="padding:6px 0;font-size:13px;font-weight:600;color:#737373;">Email</td>
            <td style="padding:6px 0;font-size:14px;color:#0A0A0A;">${email}</td>
          </tr>
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

      <!-- CTA -->
      <div style="text-align:center;">
        <a href="${SITE_URL}/admin/clienti"
          style="display:inline-block;background:linear-gradient(135deg,#ED03E9,#6B00E8);color:#fff;text-decoration:none;padding:13px 28px;border-radius:12px;font-weight:700;font-size:14px;">
          Deschide panoul de admin →
        </a>
      </div>

      <p style="margin:20px 0 0;font-size:12px;color:#ABABAB;text-align:center;">
        Această notificare a fost trimisă automat de platforma Mentorat cu Roxana.
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
