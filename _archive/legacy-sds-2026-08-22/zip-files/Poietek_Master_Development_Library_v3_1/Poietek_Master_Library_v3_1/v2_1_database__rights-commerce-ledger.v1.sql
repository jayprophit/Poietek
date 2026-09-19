-- Poietek rights/commerce reference schema.
-- Monetary values are integer minor units.

create table if not exists parties (
  id text primary key,
  party_type text not null,
  display_name text not null,
  public_profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists party_external_identifiers (
  id bigserial primary key,
  party_id text not null references parties(id) on delete cascade,
  namespace text not null,
  identifier_kind text not null,
  encrypted_value bytea not null,
  masked_value text,
  verification text not null,
  verified_at timestamptz,
  unique(party_id, namespace, identifier_kind)
);

create table if not exists project_access_policies (
  project_id text primary key,
  owner_party_id text not null references parties(id),
  policy jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists contributor_sessions (
  id text primary key,
  project_id text not null,
  party_id text not null references parties(id),
  device_id text not null,
  role text not null,
  access_mode text not null,
  permissions jsonb not null default '[]'::jsonb,
  status text not null,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists contributor_sessions_project_idx
on contributor_sessions(project_id, status);

create table if not exists rights_manifests (
  id text not null,
  version integer not null,
  asset_id text not null,
  content_hash text not null,
  manifest jsonb not null,
  state text not null,
  created_at timestamptz not null default now(),
  primary key(id, version)
);

create table if not exists registration_receipts (
  id text primary key,
  rights_manifest_id text not null,
  rights_manifest_version integer not null,
  provider text not null,
  registration_kind text not null,
  status text not null,
  external_ids jsonb not null default '{}'::jsonb,
  receipt_ref text,
  submitted_at timestamptz,
  confirmed_at timestamptz,
  raw_response_asset_id text
);

create table if not exists products (
  id text primary key,
  seller_party_id text not null references parties(id),
  product_type text not null,
  title text not null,
  asset_id text,
  rights_manifest_id text,
  active boolean not null default true
);

create table if not exists commerce_policies (
  id text not null,
  version integer not null,
  product_id text not null references products(id),
  policy jsonb not null,
  effective_at timestamptz not null default now(),
  primary key(id, version)
);

create table if not exists orders (
  id text primary key,
  buyer_user_id uuid,
  currency char(3) not null,
  gross_minor bigint not null check(gross_minor >= 0),
  payment_rail text not null,
  external_payment_ref text,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists order_lines (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id text not null references products(id),
  commerce_policy_id text not null,
  commerce_policy_version integer not null,
  gross_minor bigint not null check(gross_minor >= 0),
  licence_grant jsonb not null default '{}'::jsonb
);

create table if not exists ledger_entries (
  id bigserial primary key,
  order_line_id text references order_lines(id),
  party_id text not null references parties(id),
  entry_type text not null,
  currency char(3) not null,
  amount_minor bigint not null,
  rights_manifest_id text,
  rights_manifest_version integer,
  commerce_policy_id text,
  commerce_policy_version integer,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ledger_party_idx
on ledger_entries(party_id, created_at desc);

create table if not exists payout_accounts (
  id text primary key,
  party_id text not null references parties(id),
  provider text not null,
  provider_account_ref text not null,
  status text not null
);

create table if not exists payout_items (
  id text primary key,
  party_id text not null references parties(id),
  currency char(3) not null,
  amount_minor bigint not null check(amount_minor >= 0),
  payout_account_id text references payout_accounts(id),
  external_transfer_ref text,
  status text not null,
  created_at timestamptz not null default now()
);

create table if not exists royalty_statements (
  id text primary key,
  provider text not null,
  source_hash text not null,
  raw_asset_id text,
  imported_at timestamptz not null default now()
);

create table if not exists royalty_lines (
  id bigserial primary key,
  statement_id text not null references royalty_statements(id) on delete cascade,
  recording_isrc text,
  work_iswc text,
  external_work_id text,
  territory text,
  usage_type text,
  amount_minor bigint,
  currency char(3),
  match_status text not null,
  rights_manifest_id text,
  metadata jsonb not null default '{}'::jsonb
);
