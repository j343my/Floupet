-- Fix Infinite Recursion in Row Level Security & Introduce Atomic RPCs

-- 1. Helper function bypassing RLS to safely query user's memberships
create or replace function public.get_user_household_ids()
returns setof uuid
language sql
security definer
set search_path = public
as $$
  select household_id from memberships where user_id = auth.uid();
$$;

-- 2. Drop recursive policies
drop policy if exists "Users can view their households" on public.households;
drop policy if exists "Owner and Admin can update household" on public.households;

drop policy if exists "Users can view memberships of their households" on public.memberships;

drop policy if exists "Users can view pets of their households" on public.pets;
drop policy if exists "Only Owner/Admin can insert/update pets" on public.pets;

drop policy if exists "Users can view feed logs of their pets" on public.feed_logs;
drop policy if exists "Users can insert feed logs for their pets" on public.feed_logs;

-- 3. Recreate correct policies using the helper function
-- Households
create policy "Users can view their households" on public.households
  for select using (
    id in (select public.get_user_household_ids())
  );

create policy "Owner and Admin can update household" on public.households
  for update using (
    id in (
      select household_id from public.memberships 
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Memberships
create policy "Memberships viewable by household members" on public.memberships
  for select using (
    household_id in (select public.get_user_household_ids())
  );

-- Pets
create policy "Users can view pets of their households" on public.pets
  for select using (
    household_id in (select public.get_user_household_ids())
  );

create policy "Only Owner/Admin can insert/update pets" on public.pets
  for all using (
    household_id in (
      select household_id from public.memberships 
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Logs (Feed)
create policy "Users can view feed logs of their pets" on public.feed_logs
  for select using (
    pet_id in (
      select id from public.pets where household_id in (select public.get_user_household_ids())
    )
  );

create policy "Users can insert feed logs for their pets" on public.feed_logs
  for insert with check (
    pet_id in (
      select id from public.pets where household_id in (select public.get_user_household_ids())
    )
  );


-- 4. Create secure RPC block for atomic Household Creation + Owner role
create or replace function public.create_household_and_join(household_name text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
  result json;
begin
  -- Insert household
  insert into public.households (name)
  values (household_name)
  returning id into new_household_id;

  -- Insert membership
  insert into public.memberships (user_id, household_id, role)
  values (auth.uid(), new_household_id, 'owner');

  -- Get result
  select json_build_object('id', id, 'name', name)
  into result
  from public.households
  where id = new_household_id;

  return result;
end;
$$;


-- 5. Create secure RPC block for joining via Invitation
create or replace function public.join_household(invitation_id uuid, target_household_id uuid, target_role text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inv public.invitations%rowtype;
begin
  -- Validate invitation
  select * into inv
  from public.invitations
  where id = invitation_id
    and household_id = target_household_id
    and accepted_at is null;

  if not found then
    raise exception 'Invitation invalid or expired';
  end if;

  -- Insert membership
  insert into public.memberships (user_id, household_id, role)
  values (auth.uid(), target_household_id, target_role::public.household_role_enum);

  -- Mark accepted
  update public.invitations
  set accepted_at = now()
  where id = invitation_id;

  return true;
end;
$$;
