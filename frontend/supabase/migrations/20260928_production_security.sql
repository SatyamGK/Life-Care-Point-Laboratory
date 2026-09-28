-- LifeCare Point Laboratory production schema.
-- Server/API uses the Supabase service role; browser users do not receive
-- direct read/write access to these sensitive tables.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  booking_type text not null default 'test',
  name text not null,
  mobile text not null,
  item_name text not null,
  price numeric,
  status text not null default 'new',
  whatsapp_status text not null default 'pending',
  whatsapp_message_id text,
  ip_hash text,
  user_agent text
);

alter table public.bookings add column if not exists created_at timestamptz not null default now();
alter table public.bookings add column if not exists booking_type text not null default 'test';
alter table public.bookings add column if not exists status text not null default 'new';
alter table public.bookings add column if not exists whatsapp_status text not null default 'pending';
alter table public.bookings add column if not exists whatsapp_message_id text;
alter table public.bookings add column if not exists ip_hash text;
alter table public.bookings add column if not exists user_agent text;

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  mobile text not null,
  message text,
  source text not null default 'website',
  status text not null default 'new',
  whatsapp_status text not null default 'pending',
  whatsapp_message_id text,
  ip_hash text,
  user_agent text
);

alter table public.enquiries add column if not exists created_at timestamptz not null default now();
alter table public.enquiries add column if not exists source text not null default 'website';
alter table public.enquiries add column if not exists status text not null default 'new';
alter table public.enquiries add column if not exists whatsapp_status text not null default 'pending';
alter table public.enquiries add column if not exists whatsapp_message_id text;
alter table public.enquiries add column if not exists ip_hash text;
alter table public.enquiries add column if not exists user_agent text;

create table if not exists public.interaction_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_type text not null,
  page text,
  source text,
  session_id text,
  user_agent text,
  ip_hash text,
  metadata jsonb not null default '{}'::jsonb
);

create index if not exists bookings_created_at_idx on public.bookings(created_at desc);
create index if not exists enquiries_created_at_idx on public.enquiries(created_at desc);
create index if not exists interaction_events_created_at_idx on public.interaction_events(created_at desc);
create index if not exists interaction_events_type_idx on public.interaction_events(event_type);

alter table public.bookings enable row level security;
alter table public.enquiries enable row level security;
alter table public.interaction_events enable row level security;

-- No public/anon policies are created intentionally. Server API operations
-- use the service-role key and therefore bypass RLS.
revoke all on public.bookings from anon, authenticated;
revoke all on public.enquiries from anon, authenticated;
revoke all on public.interaction_events from anon, authenticated;

create table if not exists public.api_rate_limits (
  key text primary key,
  window_started_at timestamptz not null,
  request_count integer not null default 0
);

alter table public.api_rate_limits enable row level security;
revoke all on public.api_rate_limits from anon, authenticated;

create or replace function public.consume_rate_limit(
  p_key text,
  p_window_seconds integer,
  p_max_requests integer
)
returns table(allowed boolean, remaining integer, retry_after integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_row public.api_rate_limits%rowtype;
  v_elapsed integer;
begin
  if p_key is null or length(p_key) = 0 or length(p_key) > 300 then
    raise exception 'Invalid rate limit key';
  end if;

  if p_window_seconds < 1 or p_window_seconds > 86400 then
    raise exception 'Invalid rate limit window';
  end if;

  if p_max_requests < 1 or p_max_requests > 10000 then
    raise exception 'Invalid rate limit maximum';
  end if;

  -- Serialize concurrent requests for the same logical bucket. This avoids
  -- the race where two first-time requests both observe "no row" and then
  -- attempt to insert the same key simultaneously.
  perform pg_advisory_xact_lock(hashtextextended(p_key, 0));

  select * into v_row
  from public.api_rate_limits
  where key = p_key
  for update;

  if not found then
    insert into public.api_rate_limits(key, window_started_at, request_count)
    values (p_key, v_now, 1);
    return query select true, greatest(p_max_requests - 1, 0), p_window_seconds;
    return;
  end if;

  v_elapsed := greatest(0, floor(extract(epoch from (v_now - v_row.window_started_at)))::integer);

  if v_elapsed >= p_window_seconds then
    update public.api_rate_limits
    set window_started_at = v_now, request_count = 1
    where key = p_key;
    return query select true, greatest(p_max_requests - 1, 0), p_window_seconds;
    return;
  end if;

  if v_row.request_count >= p_max_requests then
    return query select false, 0, greatest(p_window_seconds - v_elapsed, 1);
    return;
  end if;

  update public.api_rate_limits
  set request_count = request_count + 1
  where key = p_key;

  return query
    select true,
           greatest(p_max_requests - v_row.request_count - 1, 0),
           greatest(p_window_seconds - v_elapsed, 1);
end;
$$;
revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- Abuse-control hardening:
-- Counters are keyed by a server-derived Vercel client IP hash, endpoint,
-- mobile identity hash, or duplicate fingerprint. No client can choose the
-- rate-limit key.
create index if not exists api_rate_limits_window_idx
  on public.api_rate_limits(window_started_at);
