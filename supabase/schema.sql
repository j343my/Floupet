-- ==============================================================================
-- FLOUPET — SUPABASE SCHEMA (PostgreSQL)
-- Basé sur les spécifications fonctionnelles v1.0 (Février 2026)
-- ==============================================================================

-- 1. EXTENSIONS
create extension if not exists "uuid-ossp";

-- 2. ENUMS
create type species_enum as enum ('cat', 'dog', 'rabbit', 'bird', 'fish', 'reptile', 'other');
create type sex_enum as enum ('male', 'female', 'unknown');
create type household_role_enum as enum ('owner', 'admin', 'member', 'viewer');
create type product_type_enum as enum ('kibble', 'wet_food', 'pouch', 'treat', 'other');
create type medication_status_enum as enum ('given', 'skipped', 'pending');

-- 3. TABLES

-- Users (Profiles linked to auth.users)
-- (Optionnel si on se base uniquement sur auth.users, 
-- mais recommandé pour stocker nom/prénom ou avatar sans polluer auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Foyer (Household)
create table public.households (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Membres du foyer (Memberships)
create table public.memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  household_id uuid references public.households(id) on delete cascade not null,
  role household_role_enum not null default 'member',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, household_id)
);

-- Animaux (Pets)
create table public.pets (
  id uuid primary key default uuid_generate_v4(),
  household_id uuid references public.households(id) on delete cascade not null,
  name text not null,
  species species_enum not null,
  breed text,
  birth_date date,
  sex sex_enum not null default 'unknown',
  neutered boolean default false,
  target_weight_kg decimal,
  photo_url text,
  notes text,
  archived_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Produits (Products)
-- Global table (not tied to a household)
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  barcode text unique,
  name text not null,
  brand text,
  product_type product_type_enum not null,
  net_weight_g decimal,
  grams_per_unit decimal,
  kcal_per_100g decimal,
  photo_url text,
  verified boolean default false,
  created_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Journal Alimentaire (Feed Logs)
create table public.feed_logs (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete set null,
  quantity_grams decimal,
  quantity_units decimal,
  given_by uuid references public.profiles(id) on delete set null,
  given_at timestamptz default now(),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Journal de Poids (Weight Logs)
create table public.weight_logs (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  weight_kg decimal not null,
  date date not null default current_date,
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Rendez-vous vétérinaires (Vaccinations et RDV Véto - v1)
create table public.vet_appointments (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  date timestamptz not null,
  clinic text,
  reason text not null,
  notes text,
  status text default 'scheduled',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.vaccinations (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  name text not null,
  date_given date not null,
  next_due_date date,
  vet_name text,
  attachment_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Médicaments et Traitements (Medications)
create table public.medications (
  id uuid primary key default uuid_generate_v4(),
  pet_id uuid references public.pets(id) on delete cascade not null,
  name text not null,
  dosage text not null,
  start_date date not null,
  end_date date,
  frequency text not null,
  instructions text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Prises individuelles de médicaments (Medication Events)
create table public.medication_events (
  id uuid primary key default uuid_generate_v4(),
  medication_id uuid references public.medications(id) on delete cascade not null,
  scheduled_at timestamptz not null,
  status medication_status_enum default 'pending',
  reason_skipped text,
  recorded_by uuid references public.profiles(id) on delete set null,
  recorded_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- L'isolation de la donnée est stricte : un user ne voit que les foyers 
-- auxquels il appartient, et en cascade les animaux et données associées.
-- ==============================================================================

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.memberships enable row level security;
alter table public.pets enable row level security;
alter table public.products enable row level security;
alter table public.feed_logs enable row level security;
alter table public.weight_logs enable row level security;
alter table public.vet_appointments enable row level security;
alter table public.vaccinations enable row level security;
alter table public.medications enable row level security;
alter table public.medication_events enable row level security;

-- PROFILES
create policy "Public profiles are viewable by everyone." 
  on public.profiles for select using (true);
create policy "Users can insert their own profile." 
  on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile." 
  on public.profiles for update using (auth.uid() = id);

-- HOUSEHOLDS
-- Voir uniquement les foyers dont on est membre
create policy "Users can view their households" on public.households
  for select using (
    exists (select 1 from public.memberships where household_id = id and user_id = auth.uid())
  );
-- L'update dépend du rôle (Owner / Admin)
create policy "Owner and Admin can update household" on public.households
  for update using (
    exists (
      select 1 from public.memberships 
      where household_id = id and user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- MEMBERSHIPS
-- Les membres d'un foyer voient tous les autres membres (pour l'UI)
create policy "Users can view memberships of their households" on public.memberships
  for select using (
    household_id in (select household_id from public.memberships where user_id = auth.uid())
  );

-- PETS
create policy "Users can view pets of their households" on public.pets
  for select using (
    household_id in (select household_id from public.memberships where user_id = auth.uid())
  );
create policy "Only Owner/Admin can insert/update pets" on public.pets
  for all using (
    household_id in (
      select household_id from public.memberships 
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- PRODUITS (Global)
-- Tout le monde peut voir les produits
create policy "Products are viewable by everyone" on public.products for select using (true);
-- Tout le monde peut proposer un produit
create policy "Members can create product proposals" on public.products for insert with check (auth.uid() = created_by);

-- FEED LOGS
-- Voir les repas des animaux de son foyer
create policy "Users can view feed logs of their pets" on public.feed_logs
  for select using (
    pet_id in (select id from public.pets where household_id in (
      select household_id from public.memberships where user_id = auth.uid()
    ))
  );

create policy "Users can insert feed logs for their pets" on public.feed_logs
  for insert with check (
    pet_id in (select id from public.pets where household_id in (
      select household_id from public.memberships where user_id = auth.uid()
    ))
  );

-- Le reste des policies pour update/delete est construit de manière similaire 
-- (Member peut update ses propres logs, Admin/Owner peut tout modifier, etc.)
-- Omitted pour brièveté de la seed basique, mais la logique suit le RLS ci-dessus.

-- ==============================================================================
-- 5. FUNCTION TRIGGER UPDATED_AT
-- ==============================================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at before update on public.profiles 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.households 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.memberships 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.pets 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.products 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.feed_logs 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.weight_logs 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.vet_appointments 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.vaccinations 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.medications 
  for each row execute procedure public.handle_updated_at();
create trigger handle_updated_at before update on public.medication_events 
  for each row execute procedure public.handle_updated_at();
