-- Migration: Add Invitations Table and RLS
-- Date: 2026-02-28

-- 1. Create the new table
create table public.invitations (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references public.households(id) on delete cascade not null,
  email text not null,
  role household_role_enum not null default 'member',
  invited_by uuid references public.profiles(id) on delete set null,
  token uuid unique default uuid_generate_v4(),
  accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Add Updated_At Trigger
create trigger handle_updated_at before update on public.invitations 
  for each row execute procedure public.handle_updated_at();

-- 3. Enable RLS
alter table public.invitations enable row level security;

-- 4. Add RLS Policies
-- Tout le monde peut voir une invitation (pour afficher le nom du foyer via le token)
create policy "Invitations are viewable by everyone" on public.invitations
  for select using (true);

-- L'insertion/suppression/maj dépend du rôle (Owner / Admin)
create policy "Owner and Admin can manage invitations" on public.invitations
  for all using (
    household_id in (
      select household_id from public.memberships 
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );
