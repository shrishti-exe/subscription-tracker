-- Migration: Add get_team_members() function for team dashboard
-- Run this in your Supabase SQL editor.

-- Returns all members of a team with their emails from user_preferences.
-- SECURITY DEFINER so it can bypass RLS to read other users' emails.
create or replace function get_team_members(p_team_id uuid)
returns table(member_id uuid, user_id uuid, role text, email text)
language plpgsql security definer as $$
begin
  -- Only allow if the caller is a member of the team
  if not exists (
    select 1 from team_members
    where team_id = p_team_id and user_id = auth.uid()
  ) then
    raise exception 'Access denied';
  end if;

  return query
    select
      tm.id   as member_id,
      tm.user_id,
      tm.role,
      coalesce(up.email, '') as email
    from team_members tm
    left join user_preferences up on up.user_id = tm.user_id
    where tm.team_id = p_team_id;
end;
$$;
