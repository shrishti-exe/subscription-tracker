-- Migration: Add join_dognosis_team() function and update delete policy
-- Run this in your Supabase SQL editor.

-- ─────────────────────────────────────────────
-- Allow all team members (not just admins) to delete subscriptions
-- ─────────────────────────────────────────────
drop policy if exists "admins can delete subscriptions" on subscriptions;

create policy "team members can delete subscriptions"
  on subscriptions for delete
  using (
    team_id in (
      select team_id from team_members where user_id = auth.uid()
    )
  );

-- ─────────────────────────────────────────────
-- join_dognosis_team()
-- Finds the shared "Dognosis" team (or creates it), adds the current
-- user as a member if not already one, and returns the team UUID.
-- Uses SECURITY DEFINER so it can bypass RLS to find the shared team.
-- ─────────────────────────────────────────────
create or replace function join_dognosis_team()
returns uuid language plpgsql security definer as $$
declare
  dognosis_team_id uuid;
begin
  -- Find the Dognosis team (bypasses RLS via security definer)
  select id into dognosis_team_id
  from teams
  where name = 'Dognosis'
  limit 1;

  if dognosis_team_id is null then
    -- First user creates the team and becomes owner
    insert into teams (name, created_by)
    values ('Dognosis', auth.uid())
    returning id into dognosis_team_id;

    insert into team_members (team_id, user_id, role)
    values (dognosis_team_id, auth.uid(), 'owner');
  else
    -- Add user as member if not already a member
    insert into team_members (team_id, user_id, role)
    values (dognosis_team_id, auth.uid(), 'member')
    on conflict (team_id, user_id) do nothing;
  end if;

  return dognosis_team_id;
end;
$$;
