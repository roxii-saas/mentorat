-- ============================================================
-- Multi-prodotto: mentorat + prodotti digitali (es. /prompturi)
-- ============================================================

create table if not exists public.products (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  name             text not null,
  kind             text not null default 'digital' check (kind in ('mentorat', 'digital')),
  price_amount     integer not null default 0,
  compare_price    integer,
  currency         text not null default 'ron',
  sales_active     boolean not null default true,
  -- Order bump (upgrade opzionale al checkout)
  bump_active      boolean not null default false,
  bump_name        text,
  bump_description text,
  bump_price       integer,
  -- File consegnati via email (bucket privato product-files)
  file_path        text,
  bump_file_path   text,
  -- Email personalizzata (placeholder: {nume})
  email_subject    text,
  email_body       text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table public.products enable row level security;

drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products" on public.products
  for select using (true);

drop policy if exists "Admin can manage products" on public.products;
create policy "Admin can manage products" on public.products
  for all using (public.is_admin()) with check (public.is_admin());

-- Prodotti iniziali
insert into public.products (slug, name, kind, price_amount, currency)
select 'mentorat', coalesce(s.product_name, 'Mentorat Premium cu Roxana'), 'mentorat',
       coalesce(s.price_amount, 297), coalesce(s.currency, 'eur')
from public.platform_settings s where s.id = 1
on conflict (slug) do nothing;

insert into public.products (slug, name, kind, price_amount, compare_price, currency,
  bump_active, bump_name, bump_description, bump_price, email_subject, email_body)
values (
  'prompturi',
  'Pachet Complet 50+ Prompturi AI Poziții Beauty, Fashion & Lifestyle',
  'digital', 149, 399, 'ron',
  true,
  'Ghidul Video: Cum generezi imagini ultra-realiste fără aspect de plastic',
  'Tehnici avansate pas-cu-pas de texturare fină a pielii, control cinematic al luminilor și trucuri pentru evitarea artefactelor specifice AI.',
  49,
  'Colecția ta de 50+ Prompturi AI este aici ✨',
  'Bună, {nume}!

Îți mulțumesc din suflet pentru încredere. Colecția ta de 50+ prompturi pentru poziții și compoziții de revistă te așteaptă mai jos.

Începe cu Modulul 01, copiază primul prompt și generează prima ta imagine editorială chiar azi.

Cu drag,
Roxii'
)
on conflict (slug) do nothing;

-- Acquisti collegati al prodotto
alter table public.purchases add column if not exists product_id uuid references public.products(id);
alter table public.purchases add column if not exists bump_included boolean not null default false;

update public.purchases
set product_id = (select id from public.products where slug = 'mentorat')
where product_id is null;

create index if not exists purchases_product_created_idx on public.purchases (product_id, created_at desc);
create index if not exists purchases_created_idx on public.purchases (created_at desc);
create index if not exists bookings_client_idx on public.bookings (client_id, scheduled_at desc);

-- Bucket privato per i file venduti (accesso solo via service role / link firmati)
insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;
