-- ============================================================================
-- Your Journey — Supabase schema
-- Run this whole file once in Supabase: Dashboard → SQL Editor → New query.
--
-- Design notes:
--  * There is no Supabase Auth user here — accounts are just rows in a table,
--    identified by a unique username, with an OPTIONAL passphrase.
--  * Every table has Row Level Security turned on with NO policies, which
--    means the anon key (used by the browser) cannot read or write any of
--    them directly. The only way in is through the RPC functions below,
--    which are SECURITY DEFINER (they run with elevated rights) and check
--    a session token or passphrase before touching any data.
--  * "Session token" = a random UUID handed back after create_account/login,
--    stored in the browser (localStorage) and sent with every request.
--    Anyone holding that token can act as that account until it expires
--    (30 days) or they log out — this is deliberately lightweight since
--    there's no password on most accounts, matching what was asked for.
-- ============================================================================

create extension if not exists pgcrypto;

-- ---------- tables ----------
create table if not exists accounts (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  passphrase_hash text,                 -- null = no passphrase set
  avatar_url text,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  token uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table if not exists profiles (
  account_id uuid primary key references accounts(id) on delete cascade,
  unit text not null default 'lb',
  start_weight numeric,
  goal_weight numeric,
  start_date date,
  end_date date
);

create table if not exists weight_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  log_date date not null,
  weight numeric,
  hydration int not null default 0,
  note text,
  unique (account_id, log_date)
);

create table if not exists meal_photos (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references accounts(id) on delete cascade,
  log_date date not null,
  meal_type text not null,
  photo_url text not null,
  created_at timestamptz not null default now()
);

-- ---------- lock every table down; RPC functions are the only door in ----------
alter table accounts enable row level security;
alter table sessions enable row level security;
alter table profiles enable row level security;
alter table weight_logs enable row level security;
alter table meal_photos enable row level security;
-- (no policies created — anon role has zero direct access)

-- ---------- helper: resolve + validate a session token ----------
create or replace function session_account(p_token uuid)
returns uuid
language plpgsql
security definer
as $$
declare
  v_account_id uuid;
begin
  select account_id into v_account_id
  from sessions
  where token = p_token and expires_at > now();

  if v_account_id is null then
    raise exception 'Invalid or expired session.' using errcode = '28000';
  end if;

  return v_account_id;
end;
$$;

-- ---------- create_account ----------
create or replace function create_account(p_username text, p_passphrase text default null)
returns table(token uuid, account_id uuid, avatar_url text)
language plpgsql
security definer
as $$
declare
  v_username text := lower(trim(p_username));
  v_account_id uuid;
  v_token uuid;
begin
  if v_username is null or v_username = '' then
    raise exception 'Username is required.';
  end if;
  if v_username !~ '^[a-z0-9_.]+$' then
    raise exception 'Usernames can only contain letters, numbers, _ and .';
  end if;
  if exists (select 1 from accounts where username = v_username) then
    raise exception 'That username is taken.' using errcode = '23505';
  end if;

  insert into accounts (username, passphrase_hash)
  values (
    v_username,
    case when p_passphrase is not null and p_passphrase <> ''
         then crypt(p_passphrase, gen_salt('bf'))
         else null end
  )
  returning id into v_account_id;

  insert into profiles (account_id) values (v_account_id);

  insert into sessions (account_id) values (v_account_id) returning token into v_token;

  return query select v_token, v_account_id, null::text;
end;
$$;

-- ---------- login ----------
create or replace function login(p_username text, p_passphrase text default null)
returns table(token uuid, account_id uuid, avatar_url text)
language plpgsql
security definer
as $$
declare
  v_username text := lower(trim(p_username));
  v_account accounts%rowtype;
  v_token uuid;
begin
  select * into v_account from accounts where username = v_username;

  if v_account.id is null then
    raise exception 'No account with that username.' using errcode = 'P0002';
  end if;

  if v_account.passphrase_hash is not null then
    if p_passphrase is null or p_passphrase = ''
       or crypt(p_passphrase, v_account.passphrase_hash) <> v_account.passphrase_hash then
      raise exception 'Incorrect passphrase.' using errcode = '28P01';
    end if;
  end if;

  insert into sessions (account_id) values (v_account.id) returning token into v_token;

  return query select v_token, v_account.id, v_account.avatar_url;
end;
$$;

-- ---------- logout ----------
create or replace function logout(p_token uuid)
returns void
language plpgsql
security definer
as $$
begin
  delete from sessions where token = p_token;
end;
$$;

-- ---------- get current account (used to restore a session on load) ----------
create or replace function get_account(p_token uuid)
returns table(account_id uuid, username text, avatar_url text, has_passphrase boolean)
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
begin
  return query
    select a.id, a.username, a.avatar_url, (a.passphrase_hash is not null)
    from accounts a where a.id = v_account_id;
end;
$$;

-- ---------- avatar ----------
create or replace function update_avatar(p_token uuid, p_avatar_url text)
returns void
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
begin
  update accounts set avatar_url = p_avatar_url where id = v_account_id;
end;
$$;

-- ---------- passphrase management ----------
create or replace function set_passphrase(p_token uuid, p_passphrase text)
returns void
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
begin
  update accounts
  set passphrase_hash = case when p_passphrase is not null and p_passphrase <> ''
                              then crypt(p_passphrase, gen_salt('bf'))
                              else null end
  where id = v_account_id;
end;
$$;

-- ---------- profile / goal ----------
create or replace function get_profile(p_token uuid)
returns table(unit text, start_weight numeric, goal_weight numeric, start_date date, end_date date)
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
begin
  return query
    select p.unit, p.start_weight, p.goal_weight, p.start_date, p.end_date
    from profiles p where p.account_id = v_account_id;
end;
$$;

create or replace function save_profile(
  p_token uuid, p_unit text, p_start_weight numeric, p_goal_weight numeric,
  p_start_date date, p_end_date date
)
returns void
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
begin
  insert into profiles (account_id, unit, start_weight, goal_weight, start_date, end_date)
  values (v_account_id, p_unit, p_start_weight, p_goal_weight, p_start_date, p_end_date)
  on conflict (account_id) do update
    set unit = excluded.unit,
        start_weight = excluded.start_weight,
        goal_weight = excluded.goal_weight,
        start_date = excluded.start_date,
        end_date = excluded.end_date;
end;
$$;

-- ---------- weight + hydration logs ----------
create or replace function upsert_weight_log(
  p_token uuid, p_date date, p_weight numeric, p_hydration int
)
returns void
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
begin
  insert into weight_logs (account_id, log_date, weight, hydration)
  values (v_account_id, p_date, p_weight, coalesce(p_hydration, 0))
  on conflict (account_id, log_date) do update
    set weight = excluded.weight,
        hydration = excluded.hydration;
end;
$$;

create or replace function get_weight_logs(p_token uuid)
returns table(log_date date, weight numeric, hydration int)
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
begin
  return query
    select w.log_date, w.weight, w.hydration
    from weight_logs w
    where w.account_id = v_account_id
    order by w.log_date asc;
end;
$$;

-- ---------- meal photos ----------
create or replace function add_meal_photo(
  p_token uuid, p_date date, p_meal_type text, p_photo_url text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
  v_id uuid;
begin
  insert into meal_photos (account_id, log_date, meal_type, photo_url)
  values (v_account_id, p_date, p_meal_type, p_photo_url)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function delete_meal_photo(p_token uuid, p_photo_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
begin
  delete from meal_photos where id = p_photo_id and account_id = v_account_id;
end;
$$;

create or replace function get_meal_photos(p_token uuid)
returns table(id uuid, log_date date, meal_type text, photo_url text)
language plpgsql
security definer
as $$
declare
  v_account_id uuid := session_account(p_token);
begin
  return query
    select m.id, m.log_date, m.meal_type, m.photo_url
    from meal_photos m
    where m.account_id = v_account_id
    order by m.created_at asc;
end;
$$;

-- ---------- allow the anon (browser) role to call these functions ----------
grant execute on function
  create_account(text, text),
  login(text, text),
  logout(uuid),
  get_account(uuid),
  update_avatar(uuid, text),
  set_passphrase(uuid, text),
  get_profile(uuid),
  save_profile(uuid, text, numeric, numeric, date, date),
  upsert_weight_log(uuid, date, numeric, int),
  get_weight_logs(uuid),
  add_meal_photo(uuid, date, text, text),
  delete_meal_photo(uuid, uuid),
  get_meal_photos(uuid)
to anon;

-- ============================================================================
-- Storage: after running this file, go to Storage in the Supabase dashboard
-- and create a PUBLIC bucket named "photos" (avatars + food photos both go
-- here). Public means anyone with the exact file URL can view it — nobody
-- can list or guess files without the URL, and URLs include a random id.
-- ============================================================================
