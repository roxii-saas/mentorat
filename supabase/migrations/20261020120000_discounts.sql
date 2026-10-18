-- Promozioni a tempo per prodotto + codici sconto
alter table public.products
  add column if not exists promo_type text check (promo_type in ('price', 'percent')),
  add column if not exists promo_value integer check (promo_value > 0),
  add column if not exists promo_starts_at timestamptz,
  add column if not exists promo_ends_at timestamptz;

create table if not exists public.discount_codes (
  id          uuid primary key default gen_random_uuid(),
  product_id  uuid not null references public.products(id) on delete cascade,
  code        text not null,
  type        text not null check (type in ('percent', 'amount', 'price')),  -- % / sumă fixă dedusă / preț final
  value       integer not null check (value > 0),
  starts_at   timestamptz,
  ends_at     timestamptz,
  max_uses    integer check (max_uses > 0),
  used_count  integer not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create unique index if not exists discount_codes_product_code on public.discount_codes (product_id, lower(code));

-- I codici NU sono pubblici: li citește solo l'admin; la validazione per i clienti passa dal server (service role)
alter table public.discount_codes enable row level security;
drop policy if exists "Admin manages discount codes" on public.discount_codes;
create policy "Admin manages discount codes" on public.discount_codes
  for all using (public.is_admin()) with check (public.is_admin());

-- Quale codice/sconto ha usato ogni acquisto
alter table public.purchases
  add column if not exists discount_code text,
  add column if not exists discount_amount integer;
