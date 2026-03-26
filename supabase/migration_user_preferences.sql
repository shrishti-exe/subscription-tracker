-- Migration: user_preferences table for per-user notification opt-in
-- Run this in your Supabase SQL editor.

-- ─────────────────────────────────────────────
-- user_preferences
-- Stores each user's email and notification settings.
-- Email is captured on login so the cron job can send reminders.
-- ─────────────────────────────────────────────
create table if not exists user_preferences (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  email_alerts  boolean not null default false,
  advance_days  int     not null default 3,
  updated_at timestamptz default now()
);

alter table user_preferences enable row level security;

create policy "users can manage their own preferences"
  on user_preferences for all
  using  (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- get_opted_in_emails()
-- Returns email + advance_days for all users who opted in.
-- SECURITY DEFINER so the cron job can call it without needing
-- per-row access to every user's preferences.
-- ─────────────────────────────────────────────
create or replace function get_opted_in_emails()
returns table(email text, advance_days int)
language plpgsql security definer as $$
begin
  return query
    select up.email, up.advance_days
    from user_preferences up
    where up.email_alerts = true;
end;
$$;

-- ─────────────────────────────────────────────
-- make_shrishti_admin()
-- Elevates shrishti@dognosis.tech to 'owner' role in the Dognosis team.
-- Run AFTER she has logged in at least once so her row exists.
-- ─────────────────────────────────────────────
create or replace function make_shrishti_admin()
returns void language plpgsql security definer as $$
begin
  update team_members tm
  set role = 'owner'
  from user_preferences up
  where up.user_id = tm.user_id
    and up.email = 'shrishti@dognosis.tech'
    and tm.team_id = (select id from teams where name = 'Dognosis' limit 1);
end;
$$;

-- Run immediately to elevate Shrishti (safe to run even before she logs in)
select make_shrishti_admin();
