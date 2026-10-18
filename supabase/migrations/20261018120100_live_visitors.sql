-- ============================================================
-- Vizitatori pe site: statistici proprii, FĂRĂ cookie-uri și fără IP stocat, + hartă live pentru admin.
--
--  • vid = cod anonim (hash cu sare secretă, schimbat zilnic) calculat pe server: nu se salvează IP-ul, nu se scrie nimic pe dispozitiv.
--  • Poziția este la nivel de oraș (din antetele Vercel). Nu se colectează date introduse în formulare.
--  • Scrierea se face DOAR de server (service role) prin track_visit; citirea doar de admin (RLS + SECURITY INVOKER).
--  • Datele se șterg automat după 90 de zile (purge_visitor_data).
-- ============================================================

create table if not exists public.visitor_sessions (
  id              uuid primary key default gen_random_uuid(),
  vid             text not null,
  day             date not null,
  first_seen      timestamptz not null default now(),
  last_seen       timestamptz not null default now(),
  country         text,
  region          text,
  city            text,
  lat             double precision,
  lon             double precision,
  device          text,
  browser         text,
  os              text,
  lang            text,
  screen_w        integer,
  source          text,
  medium          text,
  campaign        text,
  referrer        text,
  landing_path    text,
  current_path    text,
  page_views      integer not null default 0,
  max_scroll      integer not null default 0,
  active_seconds  integer not null default 0,
  stage           text not null default 'browsing',
  stage_rank      integer not null default 0,
  product_slug    text,
  cart_value      integer,
  cart_currency   text,
  purchase_id     uuid references public.purchases(id) on delete set null,
  unique (vid, day)
);
create index if not exists visitor_sessions_last_seen_idx on public.visitor_sessions (last_seen desc);
create index if not exists visitor_sessions_first_seen_idx on public.visitor_sessions (first_seen);
create index if not exists visitor_sessions_day_idx on public.visitor_sessions (day);

create table if not exists public.visitor_events (
  id          bigint generated always as identity primary key,
  session_id  uuid not null references public.visitor_sessions(id) on delete cascade,
  created_at  timestamptz not null default now(),
  event       text not null,
  path        text,
  data        jsonb
);
create index if not exists visitor_events_session_idx on public.visitor_events (session_id, created_at);
create index if not exists visitor_events_created_idx on public.visitor_events (created_at);

alter table public.visitor_sessions enable row level security;
alter table public.visitor_events enable row level security;

drop policy if exists "Admin vede vizitatorii" on public.visitor_sessions;
create policy "Admin vede vizitatorii" on public.visitor_sessions for select using (public.is_admin());
drop policy if exists "Admin vede evenimentele" on public.visitor_events;
create policy "Admin vede evenimentele" on public.visitor_events for select using (public.is_admin());

-- ── Scriere (doar server / service role) ─────────────────────────────────────────────
create or replace function public.track_visit(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ev      text := p->>'ev';
  v_path    text := left(coalesce(p->>'path', ''), 200);
  v_day     date := (now() at time zone 'Europe/Bucharest')::date;
  v_rank    int  := 0;
  v_stage   text := 'browsing';
  v_scroll  int  := least(greatest(coalesce(nullif(p->>'scroll', '')::int, 0), 0), 100);
  v_ms      int  := least(greatest(coalesce(nullif(p->>'ms', '')::int, 0), 0), 60000);
  v_purchase uuid;
  v_sid     uuid;
  v_data    jsonb;
begin
  if coalesce(p->>'vid', '') = '' or v_ev is null then return; end if;

  -- Cel mai avansat pas din drumul spre cumpărare: 0 navighează · 1 oferta · 2 checkout · 3 completează · 4 plătește · 5 a cumpărat
  if v_ev = 'purchase' then v_rank := 5; v_stage := 'purchased';
  elsif v_ev = 'submit' then v_rank := 4; v_stage := 'paying';
  elsif v_ev = 'focus' then v_rank := 3; v_stage := 'form';
  elsif v_ev = 'pv' and v_path like '%/checkout' then v_rank := 2; v_stage := 'checkout';
  elsif v_ev = 'pv' and (v_path = '/' or v_path like '/prompturi%') and v_path not like '%/multumim' then v_rank := 1; v_stage := 'offer';
  end if;

  if v_ev = 'purchase' and coalesce(p->>'pi', '') <> '' then
    select id into v_purchase from public.purchases where stripe_payment_intent_id = p->>'pi' limit 1;
  end if;

  insert into public.visitor_sessions as s (
    vid, day, country, region, city, lat, lon, device, browser, os, lang, screen_w,
    source, medium, campaign, referrer, landing_path, current_path,
    page_views, max_scroll, active_seconds, stage, stage_rank, product_slug, cart_value, cart_currency, purchase_id
  ) values (
    p->>'vid', v_day, left(p->>'country', 2), left(p->>'region', 80), left(p->>'city', 80),
    nullif(p->>'lat', '')::float8, nullif(p->>'lon', '')::float8,
    left(p->>'device', 20), left(p->>'browser', 40), left(p->>'os', 40), left(p->>'lang', 16), nullif(p->>'sw', '')::int,
    left(p->>'src', 60), left(p->>'med', 40), left(p->>'cmp', 100), left(p->>'ref', 100), v_path, v_path,
    case when v_ev = 'pv' then 1 else 0 end, v_scroll, v_ms / 1000, v_stage, v_rank,
    left(p->>'product', 60), nullif(p->>'value', '')::int, left(p->>'cur', 3), v_purchase
  )
  on conflict (vid, day) do update set
    last_seen      = now(),
    current_path   = case when v_ev = 'pv' then v_path else s.current_path end,
    page_views     = s.page_views + case when v_ev = 'pv' then 1 else 0 end,
    max_scroll     = greatest(s.max_scroll, v_scroll),
    active_seconds = s.active_seconds + v_ms / 1000,
    stage          = case when v_rank > s.stage_rank then v_stage else s.stage end,
    stage_rank     = greatest(s.stage_rank, v_rank),
    product_slug   = coalesce(excluded.product_slug, s.product_slug),
    cart_value     = coalesce(excluded.cart_value, s.cart_value),
    cart_currency  = coalesce(excluded.cart_currency, s.cart_currency),
    purchase_id    = coalesce(excluded.purchase_id, s.purchase_id),
    -- sursa primei vizite rămâne cea a primului contact
    source         = coalesce(s.source, excluded.source),
    medium         = coalesce(s.medium, excluded.medium),
    campaign       = coalesce(s.campaign, excluded.campaign),
    referrer       = coalesce(s.referrer, excluded.referrer)
  returning s.id into v_sid;

  -- Evenimentele (fără bătăile de inimă). Maximum 300 pe sesiune; "purchase" o singură dată.
  if v_ev <> 'hb'
     and (select count(*) from public.visitor_events where session_id = v_sid) < 300
     and not (v_ev = 'purchase' and exists (select 1 from public.visitor_events where session_id = v_sid and event = 'purchase'))
  then
    v_data := jsonb_strip_nulls(jsonb_build_object(
      'scroll', case when v_ev = 'scroll' then v_scroll end,
      'product', nullif(p->>'product', ''),
      'value', nullif(p->>'value', '')::int,
      'cur', nullif(left(p->>'cur', 3), ''),
      'd', nullif(left(p->>'d', 40), '')
    ));
    insert into public.visitor_events (session_id, event, path, data)
    values (v_sid, left(v_ev, 20), v_path, nullif(v_data, '{}'::jsonb));
  end if;
end;
$$;

create or replace function public.purge_visitor_data(p_days int default 90)
returns int
language sql
security definer
set search_path = public
as $$
  with d as (
    delete from public.visitor_sessions
    where day < (now() at time zone 'Europe/Bucharest')::date - greatest(p_days, 1)
    returning 1
  )
  select count(*)::int from d
$$;

revoke all on function public.track_visit(jsonb) from public, anon, authenticated;
revoke all on function public.purge_visitor_data(int) from public, anon, authenticated;
grant execute on function public.track_visit(jsonb) to service_role;
grant execute on function public.purge_visitor_data(int) to service_role;

-- ── Citire pentru admin (SECURITY INVOKER: valabile politicile RLS → doar adminul vede date) ─────────
create or replace function public.admin_live_now(p_seconds int default 600)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(x order by x.last_seen desc), '[]'::jsonb)
  from (
    select s.id, s.first_seen, s.last_seen, s.country, s.region, s.city, s.lat, s.lon,
           s.device, s.browser, s.os, s.lang, s.screen_w, s.source, s.medium, s.campaign, s.referrer,
           s.landing_path, s.current_path, s.page_views, s.max_scroll, s.active_seconds,
           s.stage, s.stage_rank, s.product_slug, s.cart_value, s.cart_currency, s.purchase_id,
           (select jsonb_build_object('name', pu.name, 'amount', pu.amount, 'currency', pu.currency)
              from public.purchases pu where pu.id = s.purchase_id) as purchase
    from public.visitor_sessions s
    where s.last_seen >= now() - make_interval(secs => greatest(least(p_seconds, 86400), 10))
    order by s.last_seen desc
    limit 300
  ) x
$$;

create or replace function public.admin_session_events(p_session uuid)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  select coalesce(jsonb_agg(jsonb_build_object('at', e.created_at, 'event', e.event, 'path', e.path, 'data', e.data) order by e.created_at), '[]'::jsonb)
  from (select * from public.visitor_events where session_id = p_session order by created_at limit 300) e
$$;

create or replace function public.admin_live_summary(p_from timestamptz, p_to timestamptz)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with s as (
    select * from public.visitor_sessions where first_seen >= p_from and first_seen < p_to
  )
  select jsonb_build_object(
    'funnel', (
      select jsonb_build_object(
        'visitors',  count(*),
        'offer',     count(*) filter (where stage_rank >= 1),
        'checkout',  count(*) filter (where stage_rank >= 2),
        'form',      count(*) filter (where stage_rank >= 3),
        'paying',    count(*) filter (where stage_rank >= 4),
        'purchased', count(*) filter (where stage_rank >= 5),
        'avg_active', coalesce(avg(active_seconds), 0)::int,
        'scroll25',  count(*) filter (where stage_rank >= 1 and max_scroll >= 25),
        'scroll50',  count(*) filter (where stage_rank >= 1 and max_scroll >= 50),
        'scroll75',  count(*) filter (where stage_rank >= 1 and max_scroll >= 75),
        'scroll100', count(*) filter (where stage_rank >= 1 and max_scroll >= 95)
      ) from s),
    'sources', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(source, 'direct') as source, coalesce(medium, '') as medium, count(*)::int as n,
               count(*) filter (where stage_rank >= 2)::int as checkout, count(*) filter (where stage_rank >= 5)::int as purchased
        from s group by 1, 2 order by n desc limit 15) t),
    'campaigns', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select campaign, coalesce(source, 'direct') as source, count(*)::int as n,
               count(*) filter (where stage_rank >= 2)::int as checkout, count(*) filter (where stage_rank >= 5)::int as purchased
        from s where campaign is not null group by 1, 2 order by n desc limit 15) t),
    'countries', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(country, '??') as country, count(*)::int as n,
               count(*) filter (where stage_rank >= 2)::int as checkout, count(*) filter (where stage_rank >= 5)::int as purchased
        from s group by 1 order by n desc limit 15) t),
    'cities', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(city, '—') as city, coalesce(country, '??') as country, round(avg(lat)::numeric, 3) as lat, round(avg(lon)::numeric, 3) as lon,
               count(*)::int as n, count(*) filter (where stage_rank >= 2)::int as checkout, count(*) filter (where stage_rank >= 5)::int as purchased
        from s group by 1, 2 order by n desc limit 40) t),
    'devices', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(device, '?') as device, count(*)::int as n, count(*) filter (where stage_rank >= 5)::int as purchased
        from s group by 1 order by n desc) t),
    'browsers', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(browser, '?') as browser, count(*)::int as n, count(*) filter (where stage_rank >= 5)::int as purchased
        from s group by 1 order by n desc limit 10) t),
    'pages', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select e.path, count(*)::int as views, count(distinct e.session_id)::int as visitors
        from public.visitor_events e join s on s.id = e.session_id
        where e.event = 'pv' group by e.path order by views desc limit 15) t),
    'heat', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select round(lat::numeric, 2) as lat, round(lon::numeric, 2) as lon, count(*)::int as n, count(*) filter (where stage_rank >= 2)::int as hot
        from s where lat is not null and lon is not null group by 1, 2 order by n desc limit 1500) t)
  )
$$;

revoke all on function public.admin_live_now(int) from public, anon;
revoke all on function public.admin_session_events(uuid) from public, anon;
revoke all on function public.admin_live_summary(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_live_now(int) to authenticated;
grant execute on function public.admin_session_events(uuid) to authenticated;
grant execute on function public.admin_live_summary(timestamptz, timestamptz) to authenticated;
