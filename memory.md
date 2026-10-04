# Memory — Mentorat platform (Roxii Dincă)

Aggiornato: 2026-10-05 · ultimo commit di codice: `19695b9`

## Progetto
Piattaforma multi-prodotto di Roxana (Roxii Dincă): landing mentorat + landing prodotti digitali,
checkout Stripe, area cliente, admin unico con statistiche per prodotto.
Stack: Next.js 16 (leggere `node_modules/next/dist/docs/` prima di scrivere codice; il middleware è `proxy.ts`),
Supabase, Stripe, Resend, Vercel.
Sito: https://mentorat.roxii-dinca.com · Repo: github.com/roxii-saas/mentorat (branch `main`, push = deploy Vercel).
Supabase: progetto `sivrczlkoqtyjeiuvvvq`, regione Frankfurt (`eu-central-1`), piano gratuito.

## Pagine
- `/` landing mentorat (ISR 5 min, testi/CTA/immagini da Admin → Home page).
- `/checkout` mentorat (prezzo da `platform_settings`, email via Edge Function `send-welcome-email`).
- `/prompturi` landing pacchetto 50+ prompt (design Stitch "Haute Editorial", token Tailwind `ed-*`
  in `globals.css`, font Bodoni Moda + Plus Jakarta Sans, icone Material Symbols in sottoinsieme).
- `/prompturi/checkout` → `/prompturi/multumim`. `/descarca/<purchaseId>[?f=bonus]` = download.
- Admin: Overview, Clienti (filtro `?p=<slug>`), Calendar, Disponibilitate, **Produse**, Home page, Setări.

## Architettura multi-prodotto (2026-10-04)
- Tabella `products` (slug, kind `mentorat|digital`, prezzo, compare_price, valuta, sales_active,
  order bump `bump_*`, `file_path`/`bump_file_path`, `email_subject`/`email_body` con `{nume}`).
- `purchases.product_id` + `bump_included`. I 9 acquisti storici sono collegati a `mentorat`.
- Checkout digitale: Stripe deferred intent; il prezzo lo calcola SEMPRE il server (`/api/stripe/product-intent`).
- Webhook: se `metadata.product_slug` → salva acquisto (idempotente) + email Resend (`lib/delivery.ts`)
  + notifica admin; altrimenti flusso mentorat originale.
- File venduti nel bucket PRIVATO `product-files` (limite 50 MB/file sul piano gratuito); upload dall'admin
  con signed upload URL (niente limite 4,5 MB di Vercel); download via link firmato 10 min.
- Nuovo prodotto = riga in `products` + pagina landing (copiare `app/prompturi`); checkout/email/admin già pronti.
- Migration in `supabase/migrations/` (APPLICATE in produzione). `supabase/schema.sql` è VECCHIO, non usarlo.

## Performance (fatto)
- `vercel.json` → funzioni in `fra1`, vicino a Supabase (prima `iad1` USA: era la causa principale della lentezza).
- Auth con `getClaims()` (JWT ES256 verificato in locale) in `proxy.ts` e `lib/auth.ts`; `React.cache`
  per utente/admin/profilo condivisi tra layout e pagina. TTFB pagine ~0,2-0,3 s.
- Home e landing in ISR con cache settings/prodotti (`unstable_cache`, timeout 2,5 s, fallback ai default).

## Sicurezza (fatto, 2026-10-04)
- Ruolo sempre `client` alla registrazione (`handle_new_user`); trigger `protect_profile_role(_insert)`
  impediscono a un non-admin di cambiarsi/assegnarsi il ruolo. Admin creato solo via `/api/admin/setup`.
- Rimosse le policy di `purchases` aperte a tutti (insert/update `true`): ora solo lettura admin.

## Da sapere
- Se sito lento o login/checkout/webhook falliscono: controllare PRIMA che Supabase non sia in pausa.
- CLI Supabase (v2.119): lanciare i comandi con `< /dev/null`, altrimenti restano in attesa.
  Se compare la richiesta del portachiavi macOS → password del Mac + "Sempre"
  (alternativa: `SUPABASE_ACCESS_TOKEN` in `~/.zshrc`). Query: `supabase db query --linked -f file.sql`.
- Push: credenziali di `gh` (account `roxii-saas`).
- PDF prompt: originale 55 MB (troppo grande) → versione compressa pronta in
  `Desktop/Clienti/Rx/prodotto digitale prompt/AI-Brand-Prompts-Roxii-Dinca (web 7MB).pdf`
  (compressione solo delle foto con pikepdf, testo intatto).
- Nel DB il prezzo mentorat risulta 60 EUR (verificare con Roxana se è voluto).

## Da fare
1. Caricare il PDF `(web 7MB)` in Admin → Produse → prompturi, salvare.
2. Acquisto di prova su `/prompturi` (email, download, vendita in Admin → Prompturi), poi rimborso da Stripe.
3. Sostituire testimonianze e numeri segnaposto di Stitch in `components/prompturi/content.ts`
   (Elena M., Andreea C., Simona D., "3.000+ cursante", "+184%"…) con dati reali, o togliere le sezioni.
4. Order bump (+49 RON) ora DISATTIVATO: attivarlo solo dopo aver caricato il file dell'upgrade.
5. Revocare il vecchio token GitHub (PAT) che era nell'URL del remote.
6. Valutare piano Supabase Pro (niente pause, file > 50 MB).
