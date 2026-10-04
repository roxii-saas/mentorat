# Memory — Mentorat platform

Aggiornato: 2026-10-04 · ultimo commit di codice: `cb07661`

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

- Velocità software (2026-10-04): `vercel.json` → funzioni in `fra1` (Francoforte, stessa regione di
  Supabase `eu-central-1`; prima giravano in `iad1` USA → ogni query attraversava l'Atlantico).
  Auth: `getClaims()` (JWT ES256 verificato in locale) in `proxy.ts` e `lib/auth.ts` invece di `getUser()`;
  `requireAdmin`/`requireAuth`/`getProfileName` con `React.cache` → layout e pagina condividono i dati.

- Multi-prodotto + landing `/prompturi` (2026-10-04, design Stitch "Haute Editorial", token Tailwind `ed-*`):
  tabella `products` (mentorat + prodotti digitali), `purchases.product_id` + `bump_included`.
  Checkout `/prompturi/checkout` (Stripe deferred intent, prezzo dal DB in `/api/stripe/product-intent`, order bump).
  Webhook: se `metadata.product_slug` → salva + email Resend personalizzata (`lib/delivery.ts`) + notifica admin.
  Download: `/descarca/<purchaseId>[?f=bonus]` → link firmato dal bucket privato `product-files`.
  Admin: pagina "Produse" (prezzo, bump, file, testo email con {nume}); Overview/Clienti filtrano con `?p=<slug>`.
  Nuovo prodotto = riga in `products` + pagina landing; checkout/email/admin già pronti.
  Migration in `supabase/migrations/` (products + sicurezza ruoli). `supabase/schema.sql` è VECCHIO.

## Da sapere
- Se il sito è lento o login/checkout/webhook falliscono: controllare PRIMA che il progetto Supabase
  (`sivrczlkoqtyjeiuvvvq`) non sia in pausa (piano gratuito). È stata questa la causa della lentezza.
- Push: usa le credenziali di `gh` (account `roxii-saas`); nessun token nell'URL del remote.

## Da fare / da valutare
- Applicare le migration del 2026-10-04 (`supabase db push`) PRIMA del deploy di /prompturi.
- Sostituire testimonianze/numeri segnaposto di Stitch in `components/prompturi/content.ts`.
- Caricare il PDF dei prompt (e il file dell'upgrade) da Admin → Produse.
- Revocare il vecchio token GitHub (PAT) che era nell'URL del remote.
- Valutare piano Supabase Pro per evitare nuove pause.
