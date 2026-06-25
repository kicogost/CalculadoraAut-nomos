-- Provisio — Supabase initial schema + Row-Level Security.
--
-- Product shape:
--   * Anonymous users can keep local IndexedDB data.
--   * Signed-in users use Supabase as the source of truth.
--   * A one-time local-to-cloud import can create these rows on signup/login.
--   * No signed-in offline mutation sync is modeled here; direct online CRUD keeps
--     the first cloud version substantially simpler and less error-prone.
--   * Compute stays in the browser; the database stores normalized facts, not PDFs.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- user_profiles (1 app-owned metadata row per auth user)
-- ---------------------------------------------------------------------------

create table public.user_profiles (
  id                         uuid primary key references auth.users on delete cascade,
  email                      text,
  display_name               text,
  preferred_locale           text not null default 'es-ES',
  timezone                   text not null default 'Europe/Madrid',
  country_code               text not null default 'ES',
  terms_accepted_at          timestamptz,
  privacy_policy_accepted_at timestamptz,
  marketing_opt_in_at        timestamptz,
  account_deletion_requested_at timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  constraint user_profiles_preferred_locale_check
    check (preferred_locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  constraint user_profiles_timezone_check
    check (length(trim(timezone)) > 0),
  constraint user_profiles_country_code_check
    check (country_code ~ '^[A-Z]{2}$')
);

-- ---------------------------------------------------------------------------
-- app_settings (1 row per user)
-- ---------------------------------------------------------------------------

create table public.app_settings (
  user_id          uuid primary key references auth.users on delete cascade,
  active_year      int not null default 2026,
  onboarding_done  boolean not null default false,
  provisioning     jsonb not null default '{"style":"exact"}'::jsonb,
  issuer           jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint app_settings_active_year_check
    check (active_year between 2020 and 2100),
  constraint app_settings_provisioning_object_check
    check (jsonb_typeof(provisioning) = 'object'),
  constraint app_settings_provisioning_style_check
    check (
      provisioning ? 'style'
      and provisioning->>'style' in ('exact', 'conservative', 'custom')
    ),
  constraint app_settings_issuer_object_check
    check (jsonb_typeof(issuer) = 'object')
);

-- ---------------------------------------------------------------------------
-- year_profiles (1 row per user per fiscal year)
-- ---------------------------------------------------------------------------

create table public.year_profiles (
  id                  uuid primary key default extensions.gen_random_uuid(),
  user_id             uuid not null references auth.users on delete cascade,
  year                int not null,
  comunidad_autonoma  text not null,
  ss_status           jsonb not null,
  ss_status_changes   jsonb not null default '[]'::jsonb,
  recognition_basis   text not null,
  estimacion_directa  text not null,
  personal            jsonb not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  constraint year_profiles_year_check
    check (year between 2020 and 2100),
  constraint year_profiles_comunidad_check
    check (length(trim(comunidad_autonoma)) > 0),
  constraint year_profiles_ss_status_object_check
    check (jsonb_typeof(ss_status) = 'object'),
  constraint year_profiles_ss_status_kind_check
    check (
      ss_status ? 'kind'
      and ss_status->>'kind' in ('tarifa_plana_y1', 'tarifa_plana_y2', 'tramo')
    ),
  constraint year_profiles_ss_status_changes_array_check
    check (jsonb_typeof(ss_status_changes) = 'array'),
  constraint year_profiles_recognition_basis_check
    check (recognition_basis in ('devengo', 'caja')),
  constraint year_profiles_estimacion_directa_check
    check (estimacion_directa in ('simplificada', 'normal')),
  constraint year_profiles_personal_object_check
    check (jsonb_typeof(personal) = 'object'),
  unique (user_id, year)
);

create index year_profiles_user_year_idx
  on public.year_profiles (user_id, year);

-- ---------------------------------------------------------------------------
-- counterparties (clients and suppliers known to the user)
-- ---------------------------------------------------------------------------

create table public.counterparties (
  id                       uuid primary key default extensions.gen_random_uuid(),
  user_id                  uuid not null references auth.users on delete cascade,
  kind                     text not null default 'client',
  display_name             text not null,
  legal_name               text,
  tax_id                   text,
  vat_id                   text,
  email                    text,
  phone                    text,
  address                  text,
  postal_code              text,
  city                     text,
  province                 text,
  country                  text,
  country_code             text,
  default_place_of_supply  text,
  default_iva_rate         numeric(5,2),
  default_retencion_rate   numeric(5,2),
  notes                    text,
  archived_at              timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  constraint counterparties_kind_check
    check (kind in ('client', 'supplier', 'both')),
  constraint counterparties_display_name_check
    check (length(trim(display_name)) > 0),
  constraint counterparties_country_code_check
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint counterparties_default_place_of_supply_check
    check (
      default_place_of_supply is null
      or default_place_of_supply in ('domestic_es', 'eu_b2b', 'non_eu_export', 'domestic_b2c', 'other')
    ),
  constraint counterparties_default_iva_rate_check
    check (default_iva_rate is null or default_iva_rate in (0, 4, 10, 21)),
  constraint counterparties_default_retencion_rate_check
    check (default_retencion_rate is null or default_retencion_rate in (0, 7, 15)),
  unique (user_id, id)
);

create index counterparties_user_display_name_idx
  on public.counterparties (user_id, lower(display_name));

create index counterparties_user_kind_idx
  on public.counterparties (user_id, kind)
  where archived_at is null;

-- User-entered yearly metadata such as "hours spent with this client".
create table public.counterparty_year_metrics (
  id               uuid primary key default extensions.gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  counterparty_id  uuid not null,
  year             int not null,
  hours            numeric(10,2) not null default 0,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),

  constraint counterparty_year_metrics_year_check
    check (year between 2020 and 2100),
  constraint counterparty_year_metrics_hours_check
    check (hours >= 0),
  constraint counterparty_year_metrics_counterparty_fk
    foreign key (user_id, counterparty_id)
    references public.counterparties (user_id, id),
  unique (user_id, counterparty_id, year)
);

create index counterparty_year_metrics_user_year_idx
  on public.counterparty_year_metrics (user_id, year);

-- ---------------------------------------------------------------------------
-- income_entries (normalized income rows used by the tax engine)
-- ---------------------------------------------------------------------------

create table public.income_entries (
  id                 uuid primary key default extensions.gen_random_uuid(),
  user_id            uuid not null references auth.users on delete cascade,
  counterparty_id    uuid,
  date               date not null,
  paid_date          date,
  counterparty_name  text not null default '',
  amount_cents       bigint not null default 0,
  place_of_supply    text not null,
  iva_rate           numeric(5,2) not null default 0,
  retencion_rate     numeric(5,2) not null default 0,
  source             text not null default 'manual',
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint income_entries_counterparty_fk
    foreign key (user_id, counterparty_id)
    references public.counterparties (user_id, id),
  constraint income_entries_counterparty_name_check
    check (counterparty_id is not null or length(trim(counterparty_name)) > 0),
  constraint income_entries_amount_check
    check (amount_cents >= 0),
  constraint income_entries_place_of_supply_check
    check (place_of_supply in ('domestic_es', 'eu_b2b', 'non_eu_export', 'domestic_b2c', 'other')),
  constraint income_entries_iva_rate_check
    check (iva_rate in (0, 4, 10, 21)),
  constraint income_entries_retencion_rate_check
    check (retencion_rate in (0, 7, 15)),
  constraint income_entries_source_check
    check (source in ('manual', 'csv', 'ai', 'issued_document', 'bank', 'json_import', 'local_migration')),
  unique (user_id, id)
);

create index income_entries_user_date_idx
  on public.income_entries (user_id, date);

create index income_entries_user_paid_date_idx
  on public.income_entries (user_id, paid_date)
  where paid_date is not null;

create index income_entries_user_counterparty_idx
  on public.income_entries (user_id, counterparty_id)
  where counterparty_id is not null;

-- ---------------------------------------------------------------------------
-- expense_entries (normalized expense rows used by the tax engine)
-- ---------------------------------------------------------------------------

create table public.expense_entries (
  id                 uuid primary key default extensions.gen_random_uuid(),
  user_id            uuid not null references auth.users on delete cascade,
  counterparty_id    uuid,
  date               date not null,
  counterparty_name  text not null default '',
  category           text not null default 'Otros',
  amount_cents       bigint not null default 0,
  deductible_pct     numeric(5,2) not null default 100,
  input_iva_cents    bigint not null default 0,
  source             text not null default 'manual',
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint expense_entries_counterparty_fk
    foreign key (user_id, counterparty_id)
    references public.counterparties (user_id, id),
  constraint expense_entries_category_check
    check (length(trim(category)) > 0),
  constraint expense_entries_amount_check
    check (amount_cents >= 0),
  constraint expense_entries_deductible_pct_check
    check (deductible_pct between 0 and 100),
  constraint expense_entries_input_iva_check
    check (input_iva_cents >= 0 and input_iva_cents <= amount_cents),
  constraint expense_entries_source_check
    check (source in ('manual', 'csv', 'ai', 'bank', 'json_import', 'local_migration')),
  unique (user_id, id)
);

create index expense_entries_user_date_idx
  on public.expense_entries (user_id, date);

create index expense_entries_user_category_idx
  on public.expense_entries (user_id, category);

create index expense_entries_user_counterparty_idx
  on public.expense_entries (user_id, counterparty_id)
  where counterparty_id is not null;

-- ---------------------------------------------------------------------------
-- issued_documents (facturas/proformas/presupuestos)
-- ---------------------------------------------------------------------------

create table public.issued_documents (
  id                         uuid primary key default extensions.gen_random_uuid(),
  user_id                    uuid not null references auth.users on delete cascade,
  counterparty_id            uuid,
  linked_income_entry_id     uuid,
  doc_type                   text not null,
  year                       int not null,
  series                     text not null,
  number                     int not null,
  issue_date                 date not null,
  counterparty_name_snapshot text not null default '',
  counterparty_tax_id_snapshot text,
  counterparty_country_snapshot text,
  currency                   text not null default 'EUR',
  base_cents                 bigint not null default 0,
  iva_cents                  bigint not null default 0,
  retencion_cents            bigint not null default 0,
  total_cents                bigint not null default 0,
  place_of_supply            text not null,
  iva_rate                   numeric(5,2) not null default 0,
  retencion_rate             numeric(5,2) not null default 0,
  verifactu_status           text not null default 'not_generated',
  payload                    jsonb not null default '{}'::jsonb,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now(),

  constraint issued_documents_counterparty_fk
    foreign key (user_id, counterparty_id)
    references public.counterparties (user_id, id),
  constraint issued_documents_linked_income_fk
    foreign key (user_id, linked_income_entry_id)
    references public.income_entries (user_id, id),
  constraint issued_documents_doc_type_check
    check (doc_type in ('factura', 'proforma', 'presupuesto')),
  constraint issued_documents_year_check
    check (year = date_part('year', issue_date)::int),
  constraint issued_documents_series_check
    check (length(trim(series)) > 0),
  constraint issued_documents_number_check
    check (number > 0),
  constraint issued_documents_counterparty_snapshot_check
    check (
      doc_type <> 'factura'
      or counterparty_id is not null
      or length(trim(counterparty_name_snapshot)) > 0
    ),
  constraint issued_documents_currency_check
    check (currency ~ '^[A-Z]{3}$'),
  constraint issued_documents_amounts_check
    check (
      base_cents >= 0
      and iva_cents >= 0
      and retencion_cents >= 0
      and total_cents >= 0
    ),
  constraint issued_documents_place_of_supply_check
    check (place_of_supply in ('domestic_es', 'eu_b2b', 'non_eu_export', 'domestic_b2c', 'other')),
  constraint issued_documents_iva_rate_check
    check (iva_rate in (0, 4, 10, 21)),
  constraint issued_documents_retencion_rate_check
    check (retencion_rate in (0, 7, 15)),
  constraint issued_documents_verifactu_status_check
    check (verifactu_status in ('not_generated', 'generated', 'submitted', 'accepted', 'accepted_with_errors', 'rejected')),
  constraint issued_documents_payload_object_check
    check (jsonb_typeof(payload) = 'object'),
  unique (linked_income_entry_id),
  unique (user_id, id),
  unique (user_id, doc_type, year, series, number)
);

create index issued_documents_user_year_idx
  on public.issued_documents (user_id, year);

create index issued_documents_user_issue_date_idx
  on public.issued_documents (user_id, issue_date);

create index issued_documents_user_counterparty_idx
  on public.issued_documents (user_id, counterparty_id)
  where counterparty_id is not null;

-- ---------------------------------------------------------------------------
-- entitlements (client-read-only; Stripe webhook writes via service role)
-- ---------------------------------------------------------------------------

create table public.entitlements (
  user_id                 uuid primary key references auth.users on delete cascade,
  tier                    text not null default 'free',
  tier_valid_until        date,
  pro_lifetime            boolean not null default false,
  verifactu_until         date,
  ai_credits              int not null default 0,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text not null default 'inactive',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),

  constraint entitlements_tier_check
    check (tier in ('free', 'core', 'automation')),
  constraint entitlements_ai_credits_check
    check (ai_credits >= 0),
  constraint entitlements_subscription_status_check
    check (subscription_status in ('inactive', 'trialing', 'active', 'past_due', 'canceled', 'unpaid'))
);

create unique index entitlements_stripe_customer_id_idx
  on public.entitlements (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index entitlements_stripe_subscription_id_idx
  on public.entitlements (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- ---------------------------------------------------------------------------
-- Stripe webhook idempotency/audit log (service-role only)
-- ---------------------------------------------------------------------------

create table public.stripe_events (
  id                 text primary key,
  event_type         text not null,
  user_id            uuid references auth.users on delete set null,
  stripe_created_at  timestamptz,
  processed_at       timestamptz,
  payload            jsonb not null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  constraint stripe_events_payload_object_check
    check (jsonb_typeof(payload) = 'object')
);

create index stripe_events_user_id_idx
  on public.stripe_events (user_id)
  where user_id is not null;

-- ---------------------------------------------------------------------------
-- Auth signup bootstrap
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do update set email = excluded.email;

  insert into public.app_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  insert into public.entitlements (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------

alter table public.user_profiles enable row level security;
create policy "read_own_user_profile" on public.user_profiles
  for select using (auth.uid() = id);

create policy "update_own_user_profile" on public.user_profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'app_settings',
    'year_profiles',
    'counterparties',
    'counterparty_year_metrics',
    'income_entries',
    'expense_entries',
    'issued_documents'
  ] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format($policy$
      create policy "own_rows" on public.%I
        for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
    $policy$, t);
  end loop;
end;
$$;

alter table public.entitlements enable row level security;
create policy "read_own_entitlements" on public.entitlements
  for select using (auth.uid() = user_id);

alter table public.stripe_events enable row level security;
-- No client policies for stripe_events. Server-side code writes/reads it with the
-- Supabase service-role key, which bypasses RLS.

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'user_profiles',
    'app_settings',
    'year_profiles',
    'counterparties',
    'counterparty_year_metrics',
    'income_entries',
    'expense_entries',
    'issued_documents',
    'entitlements',
    'stripe_events'
  ] loop
    execute format('create trigger set_updated_at before update on public.%I
      for each row execute function public.set_updated_at();', t);
  end loop;
end;
$$;
