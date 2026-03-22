-- The Curator — Supabase Schema
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

-- ─────────────────────────────────────────────
-- Teams
-- ─────────────────────────────────────────────
create table if not exists teams (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  created_by  uuid references auth.users(id) on delete set null,
  created_at  timestamptz default now()
);

alter table teams enable row level security;

-- Team members can read their own team
create policy "team members can read team"
  on teams for select
  using (
    id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

-- Creator can update team name
create policy "creator can update team"
  on teams for update
  using (created_by = auth.uid());

-- Any authenticated user can create a team
create policy "authenticated users can create team"
  on teams for insert
  with check (auth.uid() is not null);

-- ─────────────────────────────────────────────
-- Team Members
-- ─────────────────────────────────────────────
create table if not exists team_members (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid references teams(id) on delete cascade not null,
  user_id    uuid references auth.users(id) on delete cascade not null,
  role       text not null default 'member' check (role in ('owner', 'admin', 'member')),
  invited_by uuid references auth.users(id) on delete set null,
  joined_at  timestamptz default now(),
  unique(team_id, user_id)
);

alter table team_members enable row level security;

create policy "members can read their team memberships"
  on team_members for select
  using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

create policy "admins can insert members"
  on team_members for insert
  with check (
    team_id in (
      select team_id from team_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
    or auth.uid() is not null -- allow self-join on team creation
  );

create policy "admins can delete members"
  on team_members for delete
  using (
    team_id in (
      select team_id from team_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- ─────────────────────────────────────────────
-- Subscriptions
-- ─────────────────────────────────────────────
create table if not exists subscriptions (
  id             uuid primary key default gen_random_uuid(),
  team_id        uuid references teams(id) on delete cascade not null,
  name           text not null,
  amount         numeric(10, 2) not null,
  billing_cycle  text not null check (billing_cycle in ('Monthly', 'Yearly', 'Quarterly', 'Weekly')),
  start_date     date not null,
  category       text not null default 'Other',
  linked_account text,            -- e.g. "Visa ••4242"
  status         text not null default 'active' check (status in ('active', 'cancelled', 'paused')),
  auto_renew     boolean not null default true,
  notes          text,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "team members can read subscriptions"
  on subscriptions for select
  using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

create policy "team members can insert subscriptions"
  on subscriptions for insert
  with check (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

create policy "team members can update subscriptions"
  on subscriptions for update
  using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

create policy "admins can delete subscriptions"
  on subscriptions for delete
  using (
    team_id in (
      select team_id from team_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_updated_at
  before update on subscriptions
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────
-- Helper: create team + add self as owner
-- Call this from the app after team creation
-- ─────────────────────────────────────────────
create or replace function create_team_with_owner(team_name text)
returns uuid language plpgsql security definer as $$
declare
  new_team_id uuid;
begin
  insert into teams (name, created_by)
  values (team_name, auth.uid())
  returning id into new_team_id;

  insert into team_members (team_id, user_id, role)
  values (new_team_id, auth.uid(), 'owner');

  return new_team_id;
end;
$$;
