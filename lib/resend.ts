import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY!)

export async function sendWelcomeEmail({
  to,
  name,
  password,
}: {
  to: string
  name: string
  password: string
}) {
  return resend.emails.send({
    from: 'Roxana Dinca <noreply@roxii-dinca.com>',
    to,
    subject: '🎉 Bun venit în Mentorat — Contul tău a fost creat!',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 30px; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #c97d4e; font-size: 28px; margin: 0;">Mentorat cu Roxana</h1>
          <p style="color: #666; margin-top: 8px;">Transformă-ți viața profesională</p>
        </div>

        <p style="font-size: 18px; color: #333;">Bună, <strong>${name}</strong>! 💛</p>

        <p style="color: #555; line-height: 1.7;">
          Felicitări! Plata ta a fost confirmată cu succes. Contul tău a fost creat automat și ești gata să începi călătoria spre <strong>0 → 3000€</strong>.
        </p>

        <div style="background: #fff; border: 2px solid #c97d4e; border-radius: 10px; padding: 24px; margin: 28px 0;">
          <p style="margin: 0 0 12px; font-weight: bold; color: #333;">🔑 Datele tale de acces:</p>
          <p style="margin: 6px 0; color: #555;"><strong>Email:</strong> ${to}</p>
          <p style="margin: 6px 0; color: #555;"><strong>Parolă temporară:</strong> <code style="background: #f5f5f5; padding: 2px 8px; border-radius: 4px; font-size: 15px;">${password}</code></p>
        </div>

        <div style="text-align: center; margin: 32px 0;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL}/login"
             style="background: #c97d4e; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
            Intră în platformă →
          </a>
        </div>

        <p style="color: #888; font-size: 13px; line-height: 1.6;">
          Te recomand să îți schimbi parola după primul login. Dacă ai întrebări, răspunde direct la acest email.
        </p>

        <div style="border-top: 1px solid #eee; margin-top: 32px; padding-top: 20px; text-align: center;">
          <p style="color: #aaa; font-size: 12px;">Cu drag, Roxana 💛</p>
        </div>
      </div>
    `,
  })
}
