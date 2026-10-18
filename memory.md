# Memory — Mentorat platform (Roxii Dincă)

Aggiornato: 2026-10-16 · ultimo commit di codice: vedi `git log -1` · tutto pushato; DB e deploy allineati

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
- Admin: Overview (analisi zi cu zi, filtro prodotto/periodo), Clienti (`?p=<slug>&q=&page=`), Calendar, Disponibilitate, **Produse**, Home page, Setări.

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

## Meta Pixel + Conversions API (2026-10-15, ONLINE)
- Pixel ID in produzione: `1843386920148695` (pubblico, tipo **Config** su Vercel). Tutto è **spento se manca l'env**: `NEXT_PUBLIC_META_PIXEL_ID` (solo cifre; è inlinata
  al build → serve un redeploy), `META_CAPI_TOKEN` (segreto, solo server), opzionali `META_TEST_EVENT_CODE`
  (per Events Manager → Test events) e `META_GRAPH_VERSION` (default v23.0). Senza ID: nessun banner, nessuna richiesta a Meta.
- Consenso GDPR: banner Accept/Refuz (stesso peso) in `components/meta/MetaPixel.tsx`; scelta in localStorage
  `meta_consent` (scade dopo ~6 mesi); link "Setări cookie" nei footer per revocare. Prima del consenso NON si carica
  `fbevents.js`, niente cookie `_fbp/_fbc`; gli eventi richiesti prima della scelta restano in memoria e partono solo se accetta.
- Eventi browser (`lib/meta/pixel.ts`, `<MetaEvent/>`): PageView (tutte le pagine pubbliche), ViewContent (`/`, `/prompturi`),
  InitiateCheckout (`/checkout`, `/prompturi/checkout`), AddPaymentInfo (submit), Purchase (`/checkout/success`,
  `/prompturi/multumim`, con `eventID` = id PaymentIntent e flag `once` anti-doppio).
  NON tracciati: `/admin`, `/dashboard`, `/login`, reset/update password, `/descarca`.
- Server (`lib/meta/capi.ts`): il webhook Stripe invia `Purchase` alla Conversions API (email/telefono/nome in SHA-256,
  fbp/fbc/IP/user-agent presi dai metadata del PaymentIntent, valore e valuta da Stripe). Stesso `event_id` del browser →
  Meta deduplica. Si invia SOLO se `metadata.meta_consent === '1'`; errori di rete non bloccano mai webhook/email.
  `content_ids`: `mentorat` (EUR) e `prompturi` (RON).
- Collaudo fatto: unit test CAPI (hash, telefoni RO, payload, no-consenso, errore di rete) + 27 controlli E2E con Chrome
  (nessuna richiesta a Facebook prima/senza consenso, eventi e valori, once, aree private, revoca, mobile).
  Verificato anche sul sito online con Chrome: banner, nessuna richiesta prima del consenso, dopo Accept lo script reale di Meta
  invia PageView + ViewContent (149 RON, `prompturi`) col Pixel ID giusto. NON testato: Purchase server-side con `META_CAPI_TOKEN` reale
  (serve un acquisto di prova con `META_TEST_EVENT_CODE`). Chrome headless viene ignorato da Meta: per i test usare UA normale.
- Pagine legali aggiornate (cookie + privacy: Meta come destinatario, base giuridica = consenso). Da far rivedere a Roxana/consulente.

## Redesign backend + Overview analitica (2026-10-15, ONLINE dal commit 6d7a2bb; migration SQL APPLICATA il 2026-10-15)
- Design di riferimento in Claude Design (privato): https://claude.ai/artifact/8XgTC9bryM2YNYvNajN29H (Overview desktop interattiva,
  Overview mobile, Clienți, Sistem de design). Sistema: Inter ovunque, testo minimo 12px, contrasto ≥4,5:1 (calcolato), card bianche con
  bordo 1px, niente blur/glow/gradienti/blob. Accento `#B800BA` (bottoni, testo bianco 5,6:1), testo accento `#8A008D`, sfondo `#F6F6FA`,
  bordo campi `#8A8AA0` (3:1). Vecchi: grigio chiaro 3,1:1 e bianco su `#ED03E9` 3,6:1 (sotto AA).
- Stili condivisi in `app/globals.css` (classi `g-card`, `g-btn`, `g-input`, `g-badge`, `nav-item`, `db-*`, `tnum`): stessi nomi di prima,
  quindi le pagine li ereditano. `font-serif` rimosso da tutto il backend. Sidebar, KPICard, layout, ProductTabs, ResendEmailBtn riscritti.
  Interruttori: aggiunto `left-0` alla pallina (prima usciva dal bordo) e `role="switch"`. Eliminati 6 componenti morti (Area3D, Bars3D,
  LineChart3D, AdminCharts, AdminNav, DashboardNav). Dashboard cliente: riquadro "Următoarea sesiune" piatto scuro, mini grafico = `BarChart`.
- **Overview** (`app/(admin)/admin/page.tsx` + `components/admin/OverviewDashboard.tsx`): filtri Produs (Toate/uno per prodotto), Perioadă
  (7/30/90 zile, 12 luni, intervallo personalizzato), Detaliu (zi/săptămână/lună); KPI (venit per valuta, vânzări con ↑↓% vs periodo prima,
  comandă medie, miglior periodo), grafici a barre per valuta + vendite, tabella "zi cu zi" con riga espandibile (ordini del giorno, caricati
  al click), vendite recenti, realtime → `router.refresh()`. EUR e RON non si sommano mai (una riga/grafico per valuta).
- Dati: funzioni SQL `admin_sales_by_day(p_from,p_to)` e `admin_orders(p_from,p_to,p_product,p_limit)` (jsonb, SECURITY INVOKER, giorno in
  ora di Bucarest) in `supabase/migrations/20261015120000_admin_sales_analytics.sql`. PERCHÉ: PostgREST taglia a 1000 righe → leggere tutti gli
  acquisti avrebbe troncato i totali in silenzio. `lib/admin-sales.ts` usa le RPC e, se mancano, RIPIEGA su lettura paginata + aggregazione in JS
  (identica: testata su 600 acquisti casuali con cambi ora legale) → il sito funziona anche prima di applicare la migration.
  Logica pura e testabile in `lib/admin-analytics.ts` (date come stringhe 'YYYY-MM-DD', mai fusi del browser).
- **Clienti**: `ClientiView` (grafica) + page (dati): tile "Toate" + prodotti con totali veri (da RPC), ricerca `?q=`, paginazione 25/pagina
  (prima si fermava a 1000 righe), chip prodotto e "+ upgrade". Default ora = tutti i prodotti (prima mentorat).
- Stato: migration APPLICATA in produzione il 2026-10-15 e verificata (funzioni security invoker, anon senza permesso, totali = conteggio diretto). Test con Postgres reale (PGlite).

## Email (cosa è successo il 2026-10-15)
- Due percorsi di invio: **mentorat** → Edge Function Supabase `send-welcome-email` (chiave Resend nei secret di Supabase);
  **prodotti digitali** → `lib/delivery.ts` direttamente da Vercel con `RESEND_API_KEY` (mittente `DELIVERY_FROM_EMAIL`, default `noreply@roxii-dinca.com`).
- Il 2026-10-15 le mail dei Prompturi non partivano: Resend rispondeva "The associated domain with your API key is not verified".
  CAUSA: il dominio `roxii-dinca.com` era stato spostato a un altro provider DNS (nameserver `apollo/athena.dns-parking.com`) e mancavano i record
  Resend (`resend._domainkey`, `send` MX/SPF). Rimessi i record e cliccato "Verify" in Resend → tutto funzionante (testato dall'utente).
  Quindi anche le mail del mentorat e la notifica admin erano ferme in quel periodo. Posta in arrivo: MX verso `mail.register.it` (non toccare).
- Se le mail smettono di nuovo: 1) Resend → Domains deve essere Verified; 2) `dig TXT resend._domainkey.roxii-dinca.com` deve rispondere.
- Il pulsante "Email" in Clienți mostra il motivo vero dell'errore (alert) e il mittente è configurabile con `DELIVERY_FROM_EMAIL` (opzionale).
- Le email di consegna NON hanno ancora `reply-to`: partono da `noreply@` e la FAQ dice "rispondi all'email" → da risolvere (vedi pre-lancio).

## STATO PRE-LANCIO prompturi (verifica del 2026-10-16) — leggere prima di sponsorizzare
Funziona: pagamento Stripe live → ordine in `purchases` → email Resend con PDF (7 MB già caricato, prova OK dopo il fix DNS) → link
`/descarca/<id>`; Overview/Clienti con totali veri; Pixel Meta dopo consenso; migration SQL applicate. Velocità mobile (4G lento, CPU x4):
landing LCP ~3,0 s, checkout ~3,1 s, CLS < 0,09, ~530 KB.
**BLOCCANTI (non fare partire pubblicità finché non sono risolti):**
1. **Prezzo nel DB = 5 RON** (con 399 barrato): impostato per il test e mai ripristinato. Ripristinare 149 in Admin → Produse → Prompturi
   (il salvataggio aggiorna la landing subito) e rimborsare da Stripe l'ordine di prova (è il 1° ordine `prompturi`).
2. **Testimonianze e numeri FINTI ancora online** su `/prompturi` (Elena M., Andreea C., Simona D., "+184%", "Economie 1.800 Lei/lună",
   "10x mesaje", confronto Înainte/După con immagini Stitch, "Best seller"): in `components/prompturi/content.ts` (CASES, METRICS) e in
   `app/prompturi/page.tsx`. Rischio rifiuto annunci Meta + recensioni inventate (illegale). Toglierle o sostituirle con dati/consensi reali.
**Da sistemare presto:** a) dati venditore (CUI/registro/indirizzo) assenti in Termeni e informativa; i Termeni coprono solo il mentorat, niente
clausola sui contenuti digitali; manca al checkout la casella di consenso alla consegna immediata con rinuncia al recesso (da far rivedere a un
consulente; la casella la posso aggiungere io); b) nessun contatto visibile su `/prompturi` e nessun `reply-to` nelle email (proposto
`roxana@roxii-dinca.com`); c) prezzo barrato 399 e "valori" dei bonus (99/149/79/322) = prezzi di riferimento che devono essere stati davvero
applicati negli ultimi 30 giorni, altrimenti toglierli; d) test Meta: acquisto con `META_CAPI_TOKEN` + `META_TEST_EVENT_CODE` → un solo
Purchase "Deduplicato"; verifica dominio in Business Manager e priorità Purchase (AEM).

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
- Push: credenziali di `gh` account `roxii-saas`. Sul Mac ci sono 7 account gh e l'attivo cambia con gli altri progetti:
  se il push dà 403 → `gh auth switch -u roxii-saas`.
- PDF prompt: originale 55 MB (troppo grande) → versione compressa pronta in
  `Desktop/Clienti/Rx/prodotto digitale prompt/AI-Brand-Prompts-Roxii-Dinca (web 7MB).pdf`
  (compressione solo delle foto con pikepdf, testo intatto).
- Nel DB il prezzo mentorat risulta 60 EUR (verificare con Roxana se è voluto).

## Da fare (in ordine di priorità)
1. Pre-lancio: ripristinare prezzo 149 + rimborso ordine di prova; togliere/sostituire testimonianze finte (vedi sezione sopra).
2. Reply-to + contatto su `/prompturi` + casella consenso contenuto digitale + dati venditore (con consulente).
3. Test Meta CAPI con acquisto di prova (token e codice di test su Vercel), poi togliere il codice di test.
4. Controllare online, dopo il login admin, Overview (filtri, riga espansa) e Clienti (ricerca, paginazione).
5. Order bump (+49 RON) DISATTIVATO: attivarlo solo dopo aver caricato il file dell'upgrade in Admin → Produse.
6. Revocare il vecchio token GitHub (PAT) che era nell'URL del remote.
7. Valutare piano Supabase Pro (niente pause, file > 50 MB).
8. Opzionale: Playfair (font landing) viene precaricato anche nelle pagine backend; spostarlo solo sulle landing per risparmiare ~30 KB.

## Overview con preset + Live visitatori (2026-10-18, ONLINE, commit fba96b9 + 7abea74; migration APPLICATE il 2026-10-18)
- **Overview**: default "Azi" (vista per ora), preset Azi/Ieri/Questa settimana/Questo mese/Mese scorso + ultimi 7/30/90 + personalizzato. I filtri
  restano dopo il refresh nel cookie `ov_filters` (1 anno, letto sul server: `lib/overview-filters.ts`). Confronto con periodo allineato.
  Vista oraria: migration `20261018120000_admin_sales_hourly.sql` (`admin_sales_by_hour`) — applicata.
- **Live** (`/admin/live`, `components/admin/live/*`, API `app/api/admin/live`): mappa Leaflet (calore + punti per fase), KPI, avviso "vicini all'acquisto",
  lista visitatori con cronologia, imbuto, fonti/UTM/paesi/città/dispositivi/pagine. Aggiorna ogni 5 s.
- **Tracking** senza cookie: `components/track/Tracker.tsx` → `POST /api/track` (`lib/track-server.ts`): id anonimo = sha256(segreto|giorno|ip|ua), IP mai salvato,
  geo da header Vercel, DNT/GPC rispettati, bot/admin/percorsi privati esclusi, retention 90 giorni. Segreto: `TRACK_SALT` (impostato su Vercel; altrimenti service role key).
  Migration `20261018120100_live_visitors.sql` (tabelle + `track_visit`, `admin_live_*`) — applicata.
- Testi legali aggiornati (cookie `ov_filters` + statistiche anonime). Test in scratchpad (PGlite, node, puppeteer) tutti verdi.
- Da chiedere a Roxana/utente: "mappa termica" interpretata come mappa geografica live; se intendeva heatmap dei click sulla pagina, è un altro lavoro.
- Mappa: tiles OpenStreetMap (CARTO chiedeva API key). Live NON ancora verificato online con visitatori reali: controllare dopo il deploy.
