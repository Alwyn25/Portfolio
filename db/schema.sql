-- Portfolio content store.
-- Security model:
--   * The app server only holds the public ANON key. No service-role key is deployed.
--   * Anyone may READ content (it is the public website).
--   * Only users listed in public.admins may WRITE, enforced here by RLS + a definer RPC,
--     so a bug in the API layer cannot grant write access.
--   * Every write is versioned (optimistic concurrency) and appended to content_history (audit trail).

create table if not exists public.content (
  key         text primary key check (key ~ '^[a-z][a-zA-Z0-9_-]{0,40}$'),
  data        jsonb not null,
  version     integer not null default 1,
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users(id) on delete set null
);

create table if not exists public.content_history (
  id          bigint generated always as identity primary key,
  key         text not null,
  data        jsonb not null,
  version     integer not null,
  changed_at  timestamptz not null default now(),
  changed_by  uuid references auth.users(id) on delete set null
);
create index if not exists content_history_key_idx on public.content_history (key, version desc);

create table if not exists public.admins (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  created_at  timestamptz not null default now()
);

alter table public.content         enable row level security;
alter table public.content_history enable row level security;
alter table public.admins          enable row level security;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.admins where user_id = auth.uid()) $$;

-- content: public read, no direct writes (writes go through save_content)
drop policy if exists content_public_read on public.content;
create policy content_public_read on public.content for select to anon, authenticated using (true);

-- history: admins only
drop policy if exists history_admin_read on public.content_history;
create policy history_admin_read on public.content_history for select to authenticated using (public.is_admin());

-- admins: a signed-in user may see only their own row (used by login to check admin status)
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins for select to authenticated using (user_id = auth.uid());

-- Atomic, versioned write. Returns the new version.
--   p_expected_version = null  -> create (fails if key exists)
--   p_expected_version = n     -> update only if current version = n (else 'version_conflict')
create or replace function public.save_content(p_key text, p_data jsonb, p_expected_version integer)
returns integer
language plpgsql security definer set search_path = public
as $$
declare v_new integer;
begin
  if not public.is_admin() then
    raise exception 'not_authorized' using errcode = '42501';
  end if;
  if p_key !~ '^[a-z][a-zA-Z0-9_-]{0,40}$' then
    raise exception 'invalid_key' using errcode = '22023';
  end if;
  if pg_column_size(p_data) > 1048576 then
    raise exception 'payload_too_large' using errcode = '54000';
  end if;

  if p_expected_version is null then
    insert into public.content (key, data, version, updated_by)
    values (p_key, p_data, 1, auth.uid())
    on conflict (key) do nothing
    returning version into v_new;
    if v_new is null then raise exception 'version_conflict' using errcode = '40001'; end if;
  else
    update public.content
       set data = p_data, version = version + 1, updated_at = now(), updated_by = auth.uid()
     where key = p_key and version = p_expected_version
    returning version into v_new;
    if v_new is null then raise exception 'version_conflict' using errcode = '40001'; end if;
  end if;

  insert into public.content_history (key, data, version, changed_by) values (p_key, p_data, v_new, auth.uid());
  return v_new;
end $$;

revoke all on function public.save_content(text, jsonb, integer) from public, anon;
grant execute on function public.save_content(text, jsonb, integer) to authenticated;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;
