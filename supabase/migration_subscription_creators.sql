-- Migration: get_subscriptions_with_creator() for store + team activity
-- Run this in your Supabase SQL editor.

-- Returns all subscriptions for a team, with the creator's email joined
-- from user_preferences. SECURITY DEFINER bypasses RLS on user_preferences.
create or replace function get_subscriptions_with_creator(p_team_id uuid)
returns table(
  id             uuid,
  team_id        uuid,
  name           text,
  amount         numeric,
  billing_cycle  text,
  start_date     date,
  category       text,
  linked_account text,
  status         text,
  auto_renew     boolean,
  notes          text,
  created_by     uuid,
  created_by_email text,
  created_at     timestamptz,
  updated_at     timestamptz
)
language plpgsql security definer as $$
begin
  -- Only allow if caller is a member of the team
  if not exists (
    select 1 from team_members
    where team_members.team_id = p_team_id and user_id = auth.uid()
  ) then
    raise exception 'Access denied';
  end if;

  return query
    select
      s.id,
      s.team_id,
      s.name,
      s.amount,
      s.billing_cycle,
      s.start_date,
      s.category,
      s.linked_account,
      s.status,
      s.auto_renew,
      s.notes,
      s.created_by,
      coalesce(up.email, '') as created_by_email,
      s.created_at,
      s.updated_at
    from subscriptions s
    left join user_preferences up on up.user_id = s.created_by
    where s.team_id = p_team_id
    order by s.created_at desc;
end;
$$;
