create table if not exists blockchain_networks (
  id text primary key,
  chain_family text not null,
  chain_id text,
  display_name text not null,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb
);

create table if not exists blockchain_anchors (
  id text primary key,
  anchor_kind text not null,
  object_type text not null,
  object_id text not null,
  content_hash text not null,
  metadata_root text,
  manifest_version integer,
  signed_event_time timestamptz not null,
  provider_id text not null,
  network_id text references blockchain_networks(id),
  contract_address text,
  transaction_id text,
  block_number text,
  block_timestamp timestamptz,
  confirmation_state text not null,
  created_at timestamptz not null default now()
);

create index if not exists blockchain_anchors_object_idx
on blockchain_anchors(object_type, object_id, created_at desc);

create table if not exists contributor_approval_signatures (
  id text primary key,
  rights_manifest_id text not null,
  rights_manifest_version integer not null,
  manifest_content_hash text not null,
  party_id text not null,
  signer_identity_ref text not null,
  signature_scheme text not null,
  signature_ref text not null,
  typed_data_hash text,
  nonce text,
  signed_at timestamptz not null,
  expires_at timestamptz,
  blockchain_anchor_id text references blockchain_anchors(id),
  status text not null
);

create table if not exists settlement_batches (
  id text primary key,
  settlement_kind text not null,
  period_start timestamptz,
  period_end timestamptz,
  currency char(3),
  allocation_merkle_root text not null,
  source_statement_hash text,
  rights_manifest_refs jsonb not null default '[]'::jsonb,
  state text not null,
  created_at timestamptz not null default now()
);

create table if not exists settlement_anchor_receipts (
  settlement_batch_id text not null references settlement_batches(id),
  blockchain_anchor_id text not null references blockchain_anchors(id),
  primary key(settlement_batch_id, blockchain_anchor_id)
);

-- Full financial lines remain in the ordinary private ledger.
-- Public blockchain anchors contain hashes/roots, not raw bank/tax/payment data.
