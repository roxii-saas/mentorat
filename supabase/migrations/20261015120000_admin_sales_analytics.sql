-- ============================================================
-- Analiză vânzări pentru Overview-ul de admin (zi cu zi, pe produs)
--
-- Agregarea se face în baza de date: API-ul Supabase returnează maxim 1000 de rânduri
-- pe cerere, deci citirea tuturor achizițiilor în browser ar trunchia totalurile în tăcere.
-- Ziua se calculează în ora României (o vânzare la 23:30 rămâne în ziua ei).
--
-- Ambele funcții sunt SECURITY INVOKER: se aplică politicile RLS ale tabelei `purchases`
-- (citește doar adminul) → un utilizator obișnuit primește rezultat gol.
-- ============================================================

create or replace function public.admin_sales_by_day(p_from date, p_to date)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(t order by t.day, t.product_id, t.currency), '[]'::jsonb)
  from (
    select (created_at at time zone 'Europe/Bucharest')::date as day,
           product_id,
           lower(currency) as currency,
           count(*)::int as sales,
           coalesce(sum(amount), 0)::bigint as revenue,
           count(*) filter (where bump_included)::int as bumps
    from public.purchases
    -- interval pe created_at (folosește indexul), grupare pe ziua locală
    where created_at >= (p_from::timestamp at time zone 'Europe/Bucharest')
      and created_at <  ((p_to + 1)::timestamp at time zone 'Europe/Bucharest')
    group by 1, 2, 3
  ) t
$$;

create or replace function public.admin_orders(
  p_from date,
  p_to date,
  p_product uuid default null,
  p_limit int default 20
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with f as (
    select id, name, email, phone, amount, lower(currency) as currency,
           created_at, product_id, bump_included
    from public.purchases
    where created_at >= (p_from::timestamp at time zone 'Europe/Bucharest')
      and created_at <  ((p_to + 1)::timestamp at time zone 'Europe/Bucharest')
      and (p_product is null or product_id = p_product)
  )
  select jsonb_build_object(
    'total', (select count(*) from f),
    'rows', coalesce(
      (select jsonb_agg(x order by x.created_at desc)
         from (select * from f order by created_at desc limit greatest(least(p_limit, 200), 1)) x),
      '[]'::jsonb)
  )
$$;

revoke all on function public.admin_sales_by_day(date, date) from public, anon;
revoke all on function public.admin_orders(date, date, uuid, int) from public, anon;
grant execute on function public.admin_sales_by_day(date, date) to authenticated;
grant execute on function public.admin_orders(date, date, uuid, int) to authenticated;
