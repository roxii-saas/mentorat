-- Il pubblico (chiave anon) vede dei prodotti SOLO le colonne usate dalle pagine di vendita.
-- Restano riservati: file_path, bump_file_path (percorsi dei file venduti), email_subject, email_body, notify_*.
-- Admin e server usano i ruoli authenticated / service_role, che mantengono l'accesso completo.
-- ⚠️ Se in futuro una nuova colonna deve essere pubblica: aggiungerla qui (grant) E in PUBLIC_COLUMNS di lib/products.ts.
revoke select on public.products from anon;
grant select (
  id, slug, name, kind, price_amount, compare_price, currency, sales_active,
  bump_active, bump_name, bump_description, bump_price,
  cover_url, landing, promo_type, promo_value, promo_starts_at, promo_ends_at
) on public.products to anon;
