-- Provisio — Supabase schema + Row-Level Security.
-- Run in the Supabase SQL editor (project must be in an EU region for RGPD).
-- Design notes:
--   * Compute stays in the browser; this DB only stores small records.
--   * Store factura DATA (jsonb), not PDFs — regenerate PDFs client-side on
--     download. Keeps storage in MBs, not GBs.
--   * Every table is owned by user_id and protected by RLS (auth.uid() = user_id),
--     so the SPA can talk to Supabase directly with no API server.

-- ---------------------------------------------------------------------------
-- updated_at trigger helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- ---------------------------------------------------------------------------
-- profiles (1 row per auth user) — created on signup via the trigger below
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- app_settings (1 row per user) — provisioning, active year, issuer, hours
-- ---------------------------------------------------------------------------
create table public.app_settings (
  user_id       uuid primary key references auth.users on delete cascade,
  active_year   int  not null default 2026,
  provisioning  jsonb not null default '{"style":"exact"}',
  issuer        jsonb,
  client_hours  jsonb not null default '{}',
  updated_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- year_profiles (1 row per user per fiscal year)
-- ---------------------------------------------------------------------------
create table public.year_profiles (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users on delete cascade,
  year               int  not null,
  comunidad_autonoma text not null,
  ss_status          jsonb not null,
  ss_status_changes  jsonb,
  recognition_basis  text not null,
  estimacion_directa text not null,
  personal           jsonb not null,
  updated_at         timestamptz not null default now(),
  unique (user_id, year)
);

-- ---------------------------------------------------------------------------
-- invoices (income) — columns are queried, so kept relational
-- ---------------------------------------------------------------------------
create table public.invoices (
  id              uuid primary key,                -- client-generated (crypto.randomUUID)
  user_id         uuid not null references auth.users on delete cascade,
  date            date not null,
  paid_date       date,
  client_name     text not null default '',
  amount_cents    bigint not null default 0,
  place_of_supply text not null,
  iva_rate        numeric not null default 0,
  retencion_rate  numeric not null default 0,
  notes           text,
  updated_at      timestamptz not null default now()
);
create index invoices_user_date on public.invoices (user_id, date);

-- ---------------------------------------------------------------------------
-- expenses
-- ---------------------------------------------------------------------------
create table public.expenses (
  id              uuid primary key,
  user_id         uuid not null references auth.users on delete cascade,
  date            date not null,
  category        text not null default 'Otros',
  amount_cents    bigint not null default 0,
  deductible_pct  numeric not null default 100,
  input_iva_cents bigint not null default 0,
  notes           text,
  updated_at      timestamptz not null default now()
);
create index expenses_user_date on public.expenses (user_id, date);

-- ---------------------------------------------------------------------------
-- facturas (the invoice builder) — full Factura stored as jsonb payload
-- (wide/evolving shape incl. line items + verifactu block); a few columns
-- promoted for listing/sorting.
-- ---------------------------------------------------------------------------
create table public.facturas (
  id          uuid primary key,
  user_id     uuid not null references auth.users on delete cascade,
  year        int  not null,
  series      text not null,
  number      int  not null,
  issue_date  date not null,
  payload     jsonb not null,
  updated_at  timestamptz not null default now()
);
create index facturas_user_year on public.facturas (user_id, year);

-- ---------------------------------------------------------------------------
-- entitlements (written by the Stripe webhook; read by the app for gating)
-- ---------------------------------------------------------------------------
create table public.entitlements (
  user_id            uuid primary key references auth.users on delete cascade,
  pro                boolean not null default false,         -- one-time Pro unlock
  verifactu_until    date,                                   -- annual Verifactu service
  ai_credits         int not null default 0,                 -- metered AI reader credits
  stripe_customer_id text,
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Row-Level Security: each user sees only their own rows.
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','app_settings','year_profiles','invoices','expenses','facturas','entitlements'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    -- profiles keyed by id; the rest by user_id
    if t = 'profiles' then
      execute format($p$create policy "own_rows" on public.%I
        for all using (auth.uid() = id) with check (auth.uid() = id);$p$, t);
    else
      execute format($p$create policy "own_rows" on public.%I
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);$p$, t);
    end if;
  end loop;
end $$;

-- entitlements: clients may READ their own row but must NOT write it
-- (only the Stripe webhook, via the service-role key, writes entitlements).
drop policy "own_rows" on public.entitlements;
create policy "read_own_entitlements" on public.entitlements
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','app_settings','year_profiles','invoices','expenses','facturas','entitlements'
  ] loop
    execute format('create trigger set_updated_at before update on public.%I
      for each row execute function public.set_updated_at();', t);
  end loop;
end $$;
