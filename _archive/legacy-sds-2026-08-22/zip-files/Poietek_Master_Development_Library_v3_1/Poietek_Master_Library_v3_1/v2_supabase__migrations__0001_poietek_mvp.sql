create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  owner_id uuid not null references auth.users(id),
  title text not null,
  schema_version text not null default '1.0.0',
  visibility text not null default 'private'
    check (visibility in ('private','team','unlisted','public')),
  sync_revision text,
  modified_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.project_members (
  project_id text not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null
    check (role in ('owner','admin','producer','editor','performer','reviewer','viewer')),
  created_at timestamptz not null default now(),
  primary key(project_id,user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  project_id text not null references public.projects(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  body text not null check (char_length(body) <= 10000),
  anchor jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now(),
  edited_at timestamptz
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.comments enable row level security;

create or replace function public.is_project_member(p_project_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.user_id = auth.uid()
  );
$$;

create or replace function public.can_edit_project(p_project_id text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_members pm
    where pm.project_id = p_project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner','admin','producer','editor')
  );
$$;

create policy "profiles self read"
on public.profiles for select
using (id = auth.uid());

create policy "profiles self update"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "project members read project"
on public.projects for select
using (public.is_project_member(id));

create policy "owner creates project"
on public.projects for insert
with check (owner_id = auth.uid());

create policy "editors update project directory"
on public.projects for update
using (public.can_edit_project(id))
with check (public.can_edit_project(id));

create policy "members read membership"
on public.project_members for select
using (public.is_project_member(project_id));

create policy "owners/admins manage membership"
on public.project_members for all
using (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner','admin')
  )
)
with check (
  exists (
    select 1 from public.project_members pm
    where pm.project_id = project_members.project_id
      and pm.user_id = auth.uid()
      and pm.role in ('owner','admin')
  )
);

create policy "members read comments"
on public.comments for select
using (public.is_project_member(project_id));

create policy "members add comments"
on public.comments for insert
with check (
  public.is_project_member(project_id)
  and author_id = auth.uid()
);

create policy "authors or admins update comments"
on public.comments for update
using (
  author_id = auth.uid()
  or public.can_edit_project(project_id)
)
with check (
  author_id = auth.uid()
  or public.can_edit_project(project_id)
);
