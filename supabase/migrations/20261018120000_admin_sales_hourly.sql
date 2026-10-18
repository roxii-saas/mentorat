-- ============================================================
-- Dettaglio orario per l'Overview (Azi / Ieri): totali per ora, prodotto e valuta.
-- Ora in fusul orar al României; SECURITY INVOKER → valgono le policy RLS di `purchases` (solo admin).
-- ============================================================

create or replace function public.admin_sales_by_hour(p_day date)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(t order by t.hour, t.product_id, t.currency), '[]'::jsonb)
  from (
    select extract(hour from (created_at at time zone 'Europe/Bucharest'))::int as hour,
           product_id,
           lower(currency) as currency,
           count(*)::int as sales,
           coalesce(sum(amount), 0)::bigint as revenue,
           count(*) filter (where bump_included)::int as bumps
    from public.purchases
    where created_at >= (p_day::timestamp at time zone 'Europe/Bucharest')
      and created_at <  ((p_day + 1)::timestamp at time zone 'Europe/Bucharest')
    group by 1, 2, 3
  ) t
$$;

revoke all on function public.admin_sales_by_hour(date) from public, anon;
grant execute on function public.admin_sales_by_hour(date) to authenticated;
