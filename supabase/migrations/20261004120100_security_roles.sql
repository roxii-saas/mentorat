-- ============================================================
-- Sicurezza ruoli: nessun utente può farsi admin da solo
-- ============================================================

-- 1. Alla registrazione il ruolo è SEMPRE 'client' (prima veniva letto dai metadata inviati dall'utente).
--    L'admin si crea solo via /api/admin/setup (service role).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'client')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 2. Un utente loggato non-admin non può cambiare la colonna role (neanche sul proprio profilo).
--    auth.uid() è null per service role / SQL editor → consentito.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Non è permesso modificare il ruolo';
  end if;
  return new;
end;
$$;

-- Vale anche in INSERT: nessuno può crearsi un profilo già admin
create or replace function public.protect_profile_role_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from 'client'
     and auth.uid() is not null
     and not public.is_admin() then
    raise exception 'Non è permesso assegnare questo ruolo';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

drop trigger if exists protect_profile_role_insert on public.profiles;
create trigger protect_profile_role_insert
  before insert on public.profiles
  for each row execute function public.protect_profile_role_insert();

-- 3. La policy di insert aperta a tutti non serve (service role e trigger bypassano RLS).
drop policy if exists "Service role insert" on public.profiles;

-- 4. purchases: le policy "Service role …" erano in realtà aperte a TUTTI (ruolo public, condizione true):
--    chiunque con la chiave anon poteva inserire/modificare acquisti. La service role (webhook) bypassa RLS
--    e non ne ha bisogno → si eliminano. Resta solo la lettura per l'admin.
drop policy if exists "Service role inserisce purchases" on public.purchases;
drop policy if exists "Service role aggiorna purchases" on public.purchases;
