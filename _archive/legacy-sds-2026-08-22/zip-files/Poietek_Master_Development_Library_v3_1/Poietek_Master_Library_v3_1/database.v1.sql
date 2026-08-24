-- Poietek PostgreSQL conceptual schema v1
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_subject text UNIQUE,
  display_name text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_user_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE projects (
  id text PRIMARY KEY,
  owner_user_id uuid REFERENCES users(id),
  team_id uuid REFERENCES teams(id),
  title text NOT NULL,
  schema_version text NOT NULL,
  visibility text NOT NULL CHECK (visibility IN ('private','team','unlisted','public')),
  sync_revision text,
  thumbnail_asset_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  modified_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX projects_owner_idx ON projects(owner_user_id);
CREATE INDEX projects_team_idx ON projects(team_id);
CREATE INDEX projects_modified_idx ON projects(modified_at DESC);

CREATE TABLE project_members (
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role text NOT NULL,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

CREATE TABLE assets (
  id text PRIMARY KEY,
  project_id text REFERENCES projects(id) ON DELETE SET NULL,
  owner_user_id uuid REFERENCES users(id),
  content_hash text NOT NULL,
  media_type text NOT NULL,
  byte_length bigint NOT NULL CHECK (byte_length >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id, content_hash)
);
CREATE INDEX assets_project_idx ON assets(project_id);
CREATE INDEX assets_hash_idx ON assets(content_hash);

CREATE TABLE asset_replicas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id text NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  provider_id text NOT NULL,
  locator text NOT NULL,
  state text NOT NULL,
  access_class text NOT NULL,
  verified_hash text,
  last_verified_at timestamptz,
  UNIQUE(asset_id, provider_id, locator)
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_user_id uuid NOT NULL REFERENCES users(id),
  body text NOT NULL,
  anchor jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);
CREATE INDEX comments_project_time_idx ON comments(project_id, created_at);

CREATE TABLE project_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  revision text NOT NULL,
  state_asset_id text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sync_updates (
  id bigserial PRIMARY KEY,
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES users(id),
  client_id text NOT NULL,
  update_id text NOT NULL,
  update_bytes bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, client_id, update_id)
);
CREATE INDEX sync_updates_project_idx ON sync_updates(project_id, id);

CREATE TABLE storage_connectors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_type text NOT NULL,
  display_name text NOT NULL,
  credential_ref text NOT NULL,
  capability_cache jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_checked_at timestamptz
);

CREATE TABLE contributors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  person_or_entity_id text NOT NULL,
  roles text[] NOT NULL DEFAULT '{}',
  assignments jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text
);

CREATE TABLE split_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status text NOT NULL CHECK(status IN ('draft','proposed','approved','rejected','superseded')),
  proposal jsonb NOT NULL,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE split_approvals (
  proposal_id uuid NOT NULL REFERENCES split_proposals(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id),
  decision text NOT NULL CHECK(decision IN ('approve','reject')),
  decided_at timestamptz NOT NULL DEFAULT now(),
  signature_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY(proposal_id,user_id)
);

CREATE TABLE releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id text NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  status text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_events (
  id bigserial PRIMARY KEY,
  actor_user_id uuid REFERENCES users(id),
  project_id text REFERENCES projects(id) ON DELETE SET NULL,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX audit_project_idx ON audit_events(project_id, created_at DESC);

-- NOTE:
-- Provider-specific RLS policies belong in adapters/migrations.
-- Firebase prototype maps the same domain contracts to Firestore rather than using this SQL.
