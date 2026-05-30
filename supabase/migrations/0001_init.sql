-- ENUMS
create type account_status as enum ('trial', 'active', 'expired');
create type user_role as enum ('user', 'admin', 'reseller');
create type theme_access as enum ('non_photo', 'photo');
create type theme_badge as enum ('new', 'popular');
create type invitation_status as enum ('draft', 'active', 'expired', 'inactive');
create type attendance as enum ('hadir', 'tidak', 'ragu');
create type txn_status as enum ('pending', 'paid', 'failed', 'expired');
create type reseller_status as enum ('pending', 'active');

-- PACKAGES
create table packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price int not null,
  original_price int,
  theme_access theme_access not null,
  duration_days int not null,
  features jsonb default '[]'::jsonb,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- PROFILES (1-1 auth.users)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  plan_id uuid references packages(id),
  account_status account_status default 'trial',
  plan_expires_at timestamptz,
  role user_role default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- CATEGORIES
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  taxonomy text
);

-- THEMES
create table themes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  category_id uuid references categories(id),
  has_photo boolean default false,
  thumbnail_url text,
  badge theme_badge,
  popularity int default 0,
  component_key text not null,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- INVITATIONS
create table invitations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  theme_id uuid references themes(id),
  title text not null,
  slug text unique not null,
  status invitation_status default 'draft',
  expires_at timestamptz,
  published_at timestamptz,
  rsvp_protected boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- INVITATION DATA (1-1)
create table invitation_data (
  invitation_id uuid primary key references invitations(id) on delete cascade,
  couple jsonb default '{}'::jsonb,
  events jsonb default '[]'::jsonb,
  quotes jsonb,
  love_story jsonb,
  gallery jsonb default '[]'::jsonb,
  prewed_video_url text,
  music_url text,
  livestream jsonb,
  gift jsonb,
  settings jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- GUESTS
create table guests (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  name text not null,
  token text,
  "group" text,
  created_at timestamptz default now()
);

-- RSVPS
create table rsvps (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references invitations(id) on delete cascade,
  guest_id uuid references guests(id) on delete set null,
  guest_name text not null,
  attendance attendance not null,
  headcount int default 1,
  message text,
  is_spam boolean default false,
  created_at timestamptz default now()
);

-- TRANSACTIONS
create table transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  package_id uuid references packages(id),
  invitation_id uuid references invitations(id) on delete set null,
  amount int not null,
  gateway text,
  gateway_ref text,
  status txn_status default 'pending',
  paid_at timestamptz,
  reseller_id uuid,
  created_at timestamptz default now()
);

-- RESELLERS
create table resellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  code text unique not null,
  commission_rate numeric default 0,
  status reseller_status default 'pending',
  created_at timestamptz default now()
);
alter table transactions
  add constraint transactions_reseller_fk
  foreign key (reseller_id) references resellers(id) on delete set null;

-- AUTO-CREATE PROFILE ON SIGNUP
create function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, phone, account_status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'phone',
    'trial'
  );
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table invitations enable row level security;
alter table invitation_data enable row level security;
alter table guests enable row level security;
alter table rsvps enable row level security;
alter table transactions enable row level security;
alter table resellers enable row level security;
alter table themes enable row level security;
alter table categories enable row level security;
alter table packages enable row level security;

-- profiles: user akses miliknya
create policy "profiles_self_select" on profiles for select using (auth.uid() = id);
create policy "profiles_self_update" on profiles for update using (auth.uid() = id);

-- invitations & invitation_data & guests: hanya pemilik
create policy "inv_owner_all" on invitations for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "invdata_owner_all" on invitation_data for all
  using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()))
  with check (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));
create policy "guests_owner_all" on guests for all
  using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()))
  with check (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));

-- rsvps: insert publik (tamu), select hanya pemilik undangan
create policy "rsvp_public_insert" on rsvps for insert with check (true);
create policy "rsvp_owner_select" on rsvps for select
  using (exists (select 1 from invitations i where i.id = invitation_id and i.user_id = auth.uid()));

-- transactions: user lihat miliknya
create policy "txn_owner_select" on transactions for select using (auth.uid() = user_id);

-- themes/categories/packages: baca publik (anon boleh lihat katalog)
create policy "themes_public_read" on themes for select using (true);
create policy "categories_public_read" on categories for select using (true);
create policy "packages_public_read" on packages for select using (true);
