-- Migration: Add update/delete RLS policies for feed_logs
-- Phase 1 - Point 3: Journal alimentaire
-- Date: 2026-02-28

-- Members can update/delete their own feed logs
create policy "Members can update their own feed logs" on public.feed_logs
  for update using (
    given_by = auth.uid()
    and pet_id in (
      select id from public.pets where household_id in (select public.get_user_household_ids())
    )
  );

create policy "Members can delete their own feed logs" on public.feed_logs
  for delete using (
    given_by = auth.uid()
    and pet_id in (
      select id from public.pets where household_id in (select public.get_user_household_ids())
    )
  );

-- Owner/Admin can update/delete any feed logs in their household
create policy "Owner and Admin can update any feed log" on public.feed_logs
  for update using (
    pet_id in (
      select p.id from public.pets p
      inner join public.memberships m on m.household_id = p.household_id
      where m.user_id = auth.uid() and m.role in ('owner', 'admin')
    )
  );

create policy "Owner and Admin can delete any feed log" on public.feed_logs
  for delete using (
    pet_id in (
      select p.id from public.pets p
      inner join public.memberships m on m.household_id = p.household_id
      where m.user_id = auth.uid() and m.role in ('owner', 'admin')
    )
  );
