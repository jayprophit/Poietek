-- Poietek Supabase prototype schema.
-- Run only in a development project and review before public deployment.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  schema_version text not null,
  modified_at timestamptz not null default now(),
  visibility text not null default 'private'
    check (visibility in ('private','team','unlisted','public'))
);

create table if not exists public.project_members (
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  primary key (project_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  anchor jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.comments enable row level security;

create policy "profiles self read"
on public.profiles for select
using (auth.uid() = id);

create policy "profiles self update"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "project members can read project"
on public.projects for select
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = projects.id
      and pm.user_id = auth.uid()
  )
);

create policy "owners can insert project"
on public.projects for insert
with check (owner_id = auth.uid());

create policy "owner or editor can update project directory"
on public.projects for update
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.project_members pm
    where pm.project_id = projects.id
      and pm.user_id = auth.uid()
      and pm.role in ('admin','producer','editor')
  )
);

create policy "members can read memberships"
on public.project_members for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from public.projects p
    where p.id = project_members.project_id and p.owner_id = auth.uid()
  )
);

create policy "owner manages membership"
on public.project_members for all
using (
  exists (
    select 1 from public.projects p
    where p.id = project_members.project_id and p.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.projects p
    where p.id = project_members.project_id and p.owner_id = auth.uid()
  )
);

create policy "members can read comments"
on public.comments for select
using (
  exists (
    select 1 from public.projects p
    where p.id = comments.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
);

create policy "members can insert own comments"
on public.comments for insert
with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.projects p
    where p.id = comments.project_id
      and (
        p.owner_id = auth.uid()
        or exists (
          select 1 from public.project_members pm
          where pm.project_id = p.id and pm.user_id = auth.uid()
        )
      )
  )
);
