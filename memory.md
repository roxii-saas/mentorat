# Memory — Mentorat platform

Aggiornato: 2026-09-20 · ultimo commit di codice: `cb07661`

## Progetto
Landing + checkout Stripe + area cliente + admin per il mentorat di Roxana.
Stack: Next.js 16 (leggere `node_modules/next/dist/docs/` prima di scrivere codice), Supabase, Stripe, Resend, Vercel.
Sito: https://mentorat.roxii-dinca.com · Repo: github.com/roxii-saas/mentorat (branch `main`).

## Fatto
- Header CTA configurabile dall'admin, social Instagram/Facebook nel footer con toggle.
- Admin Home page: modifica intero bottone CTA (testo, prezzo, secondario, badge).
- Clienti letti dalla tabella `purchases`; ResendEmailBtn usa `purchaseId`.
- Webhook Stripe: `await callEdgeFunction` (Vercel killava il processo prima dell'invio email).
- Performance home (2026-09-20): `/` è ISR (`revalidate = 300`); settings da `lib/settings.ts`
  (`unstable_cache`, tag `platform-settings`, client senza cookie, timeout 2,5s, fallback ai default);
  le API admin `settings`/`homepage` invalidano la cache al salvataggio; immagini hero/mentor
  ottimizzate da `next/image`. TTFB home: da 7-8s a ~0,2s.

## Da sapere
- Se il sito è lento o login/checkout/webhook falliscono: controllare PRIMA che il progetto Supabase
  (`sivrczlkoqtyjeiuvvvq`) non sia in pausa (piano gratuito). È stata questa la causa della lentezza.
- Push: usa le credenziali di `gh` (account `roxii-saas`); nessun token nell'URL del remote.

## Da fare / da valutare
- Revocare il vecchio token GitHub (PAT) che era nell'URL del remote.
- Valutare piano Supabase Pro per evitare nuove pause.
