// @ts-nocheck — Deno runtime. Gli errori IDE sono falsi positivi.

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://mentorat.roxii-dinca.com'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') ?? 'Roxana Dinca <noreply@roxii-dinca.com>'
// ⬇️ Cambia con: npx supabase secrets set ADMIN_NOTIFICATION_EMAIL=nuova@email.com
const ADMIN_EMAIL = Deno.env.get('ADMIN_NOTIFICATION_EMAIL') ?? 'roxiiprogramari@gmail.com'
const LOGO_URL = `${SITE_URL}/logo.png`

const sendEmail = async (to: string, subject: string, html: string) => {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  })
  const data = await res.json()
  if (!res.ok) console.error(`Resend error (${to}):`, JSON.stringify(data))
  else console.log(`Email → ${to} | id: ${data.id}`)
  return { ok: res.ok, data }
}

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
    const { email, name, amount, currency, phone } = await req.json()
    if (!email) return new Response(JSON.stringify({ error: 'email richiesta' }), { status: 400 })

    const displayName = name && name !== email ? name : email.split('@')[0]
    const priceStr = amount && currency ? `${Number(amount).toLocaleString('ro-RO')} ${currency.toUpperCase()}` : ''
    const now = new Date().toLocaleString('ro-RO', {
      timeZone: 'Europe/Bucharest', dateStyle: 'long', timeStyle: 'short',
    })

    // ─────────────────────────────────────────────────────
    // EMAIL CLIENTE — Confirmare rezervare
    // ─────────────────────────────────────────────────────
    const clientHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Rezervare confirmată</title>
</head>
<body style="margin:0;padding:0;background:#F0E8FF;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0E8FF;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">

        <!-- Logo pe fundal alb -->
        <tr>
          <td align="center" style="background:#ffffff;border-radius:20px 20px 0 0;padding:28px 32px 24px;">
            <img src="${LOGO_URL}" alt="Mentorat cu Roxana"
              width="160" style="height:auto;display:block;border:0;" />
          </td>
        </tr>

        <!-- Banner gradient -->
        <tr>
          <td align="center"
            style="background:linear-gradient(135deg,#ED03E9 0%,#6B00E8 100%);padding:32px 32px 28px;">
            <h1 style="margin:0;font-size:26px;font-weight:800;color:#ffffff;line-height:1.3;letter-spacing:-0.3px;">
              Rezervarea ta este confirmată! 🎉
            </h1>
          </td>
        </tr>

        <!-- Body alb -->
        <tr>
          <td style="background:#ffffff;padding:36px 36px 8px;">

            <p style="margin:0 0 20px;font-size:17px;color:#0A0A0A;line-height:1.65;">
              Bună, <strong>${displayName}</strong>!
            </p>

            <p style="margin:0 0 24px;font-size:15px;color:#3D3D3D;line-height:1.75;">
              Îți mulțumim că ți-ai rezervat locul în programul de mentorat <strong style="color:#0A0A0A;">Mentorat cu Roxana</strong>.
              Suntem bucuroși că ai făcut acest pas important pentru tine!
            </p>

            <!-- Highlight box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="background:#F3EEFF;border-radius:14px;border-left:4px solid #ED03E9;padding:20px 24px;">
                  <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#B800BA;text-transform:uppercase;letter-spacing:.12em;">
                    Ce urmează
                  </p>
                  <p style="margin:0;font-size:15px;color:#3D3D3D;line-height:1.7;">
                    Roxana te va contacta în curând <strong style="color:#0A0A0A;">direct pe email sau telefon</strong>
                    pentru a stabili împreună pașii următori și prima ta sesiune de mentorat.
                  </p>
                </td>
              </tr>
            </table>

            <!-- Steps -->
            <p style="margin:0 0 14px;font-size:12px;font-weight:700;color:#737373;text-transform:uppercase;letter-spacing:.12em;">Parcursul tău</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${[
                ['📞', 'Roxana te contactează', 'Pe email sau telefon, pentru detalii și programarea sesiunii.'],
                ['🎯', 'Prima sesiune 1:1 — 60 min', 'Analiza situației tale și crearea strategiei personalizate.'],
                ['🚀', 'Implementezi și crești', 'Pași clari spre 3.000€/lună cu suport continuu.'],
              ].map(([emoji, title, desc]) => `
              <tr>
                <td style="padding:10px 0;vertical-align:top;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="width:36px;vertical-align:top;font-size:20px;padding-top:1px;">${emoji}</td>
                      <td style="padding-left:12px;">
                        <p style="margin:0 0 3px;font-size:14px;font-weight:700;color:#0A0A0A;">${title}</p>
                        <p style="margin:0;font-size:13px;color:#737373;line-height:1.5;">${desc}</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>`).join('')}
            </table>

          </td>
        </tr>

        <!-- Sign-off -->
        <tr>
          <td style="background:#ffffff;padding:0 36px 36px;">
            <p style="margin:0 0 4px;font-size:15px;color:#0A0A0A;">Cu drag,</p>
            <p style="margin:0 0 2px;font-size:15px;font-weight:700;color:#0A0A0A;">Roxana Dinca</p>
            <p style="margin:0;font-size:13px;color:#737373;">Mentor & Coach Business Online</p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background:#F3EEFF;border-radius:0 0 20px 20px;padding:24px 32px;">
            <img src="${LOGO_URL}" alt="Mentorat cu Roxana"
              width="100" style="height:auto;display:block;margin:0 auto 10px;" />
            <p style="margin:0;font-size:11px;color:#9090AA;line-height:1.6;">
              © ${new Date().getFullYear()} Mentorat cu Roxana · Toate drepturile rezervate<br>
              Ai primit acest email deoarece ai rezervat un loc în programul de mentorat.
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
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

    // ─────────────────────────────────────────────────────
    // EMAIL ADMIN — Notificare rezervare nouă
    // ─────────────────────────────────────────────────────
    const adminHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Rezervare nouă</title>
</head>
<body style="margin:0;padding:0;background:#F0E8FF;font-family:'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0E8FF;padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;" cellpadding="0" cellspacing="0">

        <!-- Logo pe fundal alb -->
        <tr>
          <td align="center" style="background:#ffffff;border-radius:20px 20px 0 0;padding:24px 32px 20px;">
            <img src="${LOGO_URL}" alt="Mentorat cu Roxana"
              width="140" style="height:auto;display:block;border:0;" />
          </td>
        </tr>

        <!-- Banner gradient -->
        <tr>
          <td align="center"
            style="background:linear-gradient(135deg,#ED03E9 0%,#6B00E8 100%);padding:28px 32px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:.15em;">
              Admin · Notificare
            </p>
            <h1 style="margin:0;font-size:24px;font-weight:800;color:#ffffff;">
              💰 Rezervare nouă!
            </h1>
          </td>
        </tr>

        <!-- Body alb -->
        <tr>
          <td style="background:#ffffff;padding:32px 36px 28px;">

            <p style="margin:0 0 22px;font-size:15px;color:#3D3D3D;line-height:1.65;">
              O nouă rezervare a fost finalizată. Contacteaz-o pe clientă pentru a stabili pașii următori.
            </p>

            <!-- Info table -->
            <table width="100%" cellpadding="0" cellspacing="0"
              style="background:#F3EEFF;border-radius:14px;border:1.5px solid rgba(237,3,233,0.15);padding:20px;margin-bottom:28px;">
              <tr><td style="padding:0 20px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  ${[
                    ['👤 Clientă', `<strong style="color:#0A0A0A;">${displayName}</strong>`],
                    ['📧 Email', `<a href="mailto:${email}" style="color:#ED03E9;text-decoration:none;">${email}</a>`],
                    ...(phone ? [['📞 Telefon', `<a href="tel:${phone}" style="color:#ED03E9;text-decoration:none;">${phone}</a>`]] : []),
                    ...(priceStr ? [['💶 Sumă', `<strong style="color:#ED03E9;font-size:16px;">${priceStr}</strong>`]] : []),
                    ['📅 Data', `<span style="color:#555;">${now}</span>`],
                  ].map(([label, value]) => `
                  <tr>
                    <td style="padding:9px 0;border-bottom:1px solid rgba(237,3,233,0.08);font-size:13px;font-weight:600;color:#737373;width:110px;vertical-align:middle;">${label}</td>
                    <td style="padding:9px 0;border-bottom:1px solid rgba(237,3,233,0.08);font-size:14px;color:#0A0A0A;vertical-align:middle;">${value}</td>
                  </tr>`).join('')}
                </table>
              </td></tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a href="${SITE_URL}/admin/clienti"
                    style="display:inline-block;background:linear-gradient(135deg,#ED03E9,#6B00E8);color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:14px;letter-spacing:.02em;">
                    Deschide panoul de admin →
                  </a>
                </td>
              </tr>
            </table>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="background:#F3EEFF;border-radius:0 0 20px 20px;padding:20px 32px;">
            <img src="${LOGO_URL}" alt="Mentorat cu Roxana"
              width="90" style="height:auto;display:block;margin:0 auto 8px;" />
            <p style="margin:0;font-size:11px;color:#9090AA;">
              Notificare automată · Mentorat cu Roxana · ${new Date().getFullYear()}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

    await sendEmail(
      ADMIN_EMAIL,
      `💰 Rezervare nouă${priceStr ? ` — ${priceStr}` : ''} · ${displayName}`,
      adminHtml
    )

    return new Response(JSON.stringify({ ok: true, emailId: clientResult.data.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('Edge Function error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
