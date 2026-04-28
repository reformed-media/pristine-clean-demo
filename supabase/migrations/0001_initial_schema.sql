-- =============================================================================
-- 0001_initial_schema.sql
-- Pristine Clean LI — full schema, RLS, indexes, seed data
-- =============================================================================

-- Clean slate (safe to re-run)
drop function if exists is_admin() cascade;
drop function if exists set_updated_at() cascade;
drop table if exists communication_log cascade;
drop table if exists booking_photos cascade;
drop table if exists booking_services cascade;
drop table if exists bookings cascade;
drop table if exists leads cascade;
drop table if exists vehicles cascade;
drop table if exists client_addresses cascade;
drop table if exists clients cascade;
drop table if exists services cascade;
drop table if exists admin_users cascade;

-- ---------------------------------------------------------------------------
-- Utility: auto-update updated_at on row change
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Helper: check if current user is an active admin
-- ---------------------------------------------------------------------------
create or replace function is_admin()
returns boolean
language plpgsql stable security definer
as $$
begin
  return exists (
    select 1 from admin_users
    where auth_user_id = auth.uid() and is_active = true
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table clients (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id) on delete set null,
  first_name text not null,
  last_name text not null,
  email text unique,
  phone text,
  notes text,
  lifetime_spend_cents integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table clients enable row level security;

create trigger clients_updated_at
  before update on clients
  for each row execute function set_updated_at();

-- Client reads/updates own row
create policy "clients_select_own" on clients
  for select using (auth_user_id = auth.uid() or is_admin());

create policy "clients_update_own" on clients
  for update using (auth_user_id = auth.uid() or is_admin());

-- Self-signup or admin
create policy "clients_insert_self_or_admin" on clients
  for insert with check (auth_user_id = auth.uid() or is_admin());

create policy "clients_delete_admin" on clients
  for delete using (is_admin());

-- Index
create index idx_clients_name on clients (last_name, first_name);

-- ---------------------------------------------------------------------------
-- client_addresses
-- ---------------------------------------------------------------------------
create table client_addresses (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  label text,
  street text not null,
  city text not null,
  state text not null default 'NY',
  zip text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table client_addresses enable row level security;

create trigger client_addresses_updated_at
  before update on client_addresses
  for each row execute function set_updated_at();

-- Client CRUD own addresses
create policy "addresses_select_own" on client_addresses
  for select using (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

create policy "addresses_insert_own" on client_addresses
  for insert with check (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

create policy "addresses_update_own" on client_addresses
  for update using (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

create policy "addresses_delete_own" on client_addresses
  for delete using (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

-- ---------------------------------------------------------------------------
-- vehicles
-- ---------------------------------------------------------------------------
create table vehicles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  year integer,
  make text not null,
  model text not null,
  color text,
  plate text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table vehicles enable row level security;

create trigger vehicles_updated_at
  before update on vehicles
  for each row execute function set_updated_at();

-- Client CRUD own vehicles
create policy "vehicles_select_own" on vehicles
  for select using (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

create policy "vehicles_insert_own" on vehicles
  for insert with check (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

create policy "vehicles_update_own" on vehicles
  for update using (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

create policy "vehicles_delete_own" on vehicles
  for delete using (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

-- ---------------------------------------------------------------------------
-- services
-- ---------------------------------------------------------------------------
create table services (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  category text not null check (category in ('auto', 'marine', 'home')),
  base_price_cents integer not null,
  is_addon boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table services enable row level security;

create trigger services_updated_at
  before update on services
  for each row execute function set_updated_at();

-- Anyone can read active services (anon sees prices on /book)
create policy "services_select_active" on services
  for select to anon, authenticated
  using (is_active = true);

-- Admins can also read inactive services
create policy "services_select_admin" on services
  for select to authenticated
  using (is_admin());

-- Admin only for mutations
create policy "services_insert_admin" on services
  for insert with check (is_admin());

create policy "services_update_admin" on services
  for update using (is_admin());

create policy "services_delete_admin" on services
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create table bookings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete restrict,
  vehicle_id uuid references vehicles(id) on delete set null,
  address_id uuid references client_addresses(id) on delete set null,
  scheduled_at timestamptz not null,
  estimated_duration_minutes integer,
  status text not null default 'requested'
    check (status in ('requested', 'confirmed', 'in_progress', 'complete', 'cancelled')),
  notes text,
  final_price_cents integer,
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'refunded')),
  payment_method text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table bookings enable row level security;

create trigger bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- Client can see own bookings
create policy "bookings_select_own" on bookings
  for select using (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

-- Client can create bookings for themselves
create policy "bookings_insert_own" on bookings
  for insert with check (
    exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
    or is_admin()
  );

-- Client can update only if status is still 'requested'; restrict writable fields
create policy "bookings_update_own" on bookings
  for update using (
    (exists (select 1 from clients where clients.id = client_id and clients.auth_user_id = auth.uid())
      and status = 'requested')
    or is_admin()
  )
  with check (
    is_admin()
    or (status = 'requested' and payment_status = 'unpaid' and final_price_cents is null)
  );

-- Admin only for delete
create policy "bookings_delete_admin" on bookings
  for delete using (is_admin());

-- Indexes
create index idx_bookings_scheduled_at on bookings (scheduled_at);
create index idx_bookings_status on bookings (status);
create index idx_bookings_client_scheduled on bookings (client_id, scheduled_at desc);

-- ---------------------------------------------------------------------------
-- booking_services (join table with price snapshot)
-- ---------------------------------------------------------------------------
create table booking_services (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  service_id uuid not null references services(id) on delete restrict,
  price_cents_at_booking integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (booking_id, service_id)
);

alter table booking_services enable row level security;

create trigger booking_services_updated_at
  before update on booking_services
  for each row execute function set_updated_at();

-- Client can read if parent booking is theirs
create policy "booking_services_select_own" on booking_services
  for select using (
    exists (
      select 1 from bookings b
      join clients c on c.id = b.client_id
      where b.id = booking_id and c.auth_user_id = auth.uid()
    )
    or is_admin()
  );

-- Client can insert for their own bookings
create policy "booking_services_insert_own" on booking_services
  for insert to authenticated
  with check (
    exists (
      select 1 from bookings b
      join clients c on c.id = b.client_id
      where b.id = booking_id and c.auth_user_id = auth.uid()
    )
  );

-- Admin can insert any
create policy "booking_services_insert_admin" on booking_services
  for insert with check (is_admin());

create policy "booking_services_update_admin" on booking_services
  for update using (is_admin());

create policy "booking_services_delete_admin" on booking_services
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- booking_photos
-- ---------------------------------------------------------------------------
create table booking_photos (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete cascade,
  storage_path text not null,
  kind text not null check (kind in ('before', 'after', 'other')),
  uploaded_by_admin boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table booking_photos enable row level security;

create trigger booking_photos_updated_at
  before update on booking_photos
  for each row execute function set_updated_at();

-- Client can read if parent booking is theirs
create policy "booking_photos_select_own" on booking_photos
  for select using (
    exists (
      select 1 from bookings b
      join clients c on c.id = b.client_id
      where b.id = booking_id and c.auth_user_id = auth.uid()
    )
    or is_admin()
  );

-- Admin full CRUD
create policy "booking_photos_insert_admin" on booking_photos
  for insert with check (is_admin());

create policy "booking_photos_update_admin" on booking_photos
  for update using (is_admin());

create policy "booking_photos_delete_admin" on booking_photos
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text,
  email text,
  phone text,
  source text,
  status text not null default 'new'
    check (status in ('new', 'quoted', 'scheduled', 'lost')),
  quoted_price_cents integer,
  notes text,
  converted_client_id uuid references clients(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table leads enable row level security;

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- Admin only
create policy "leads_select_admin" on leads
  for select using (is_admin());

create policy "leads_insert_admin" on leads
  for insert with check (is_admin());

create policy "leads_update_admin" on leads
  for update using (is_admin());

create policy "leads_delete_admin" on leads
  for delete using (is_admin());

-- Index
create index idx_leads_status on leads (status);

-- ---------------------------------------------------------------------------
-- communication_log
-- ---------------------------------------------------------------------------
create table communication_log (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  lead_id uuid references leads(id) on delete cascade,
  channel text not null
    check (channel in ('text', 'call', 'email', 'instagram', 'in_person', 'other')),
  direction text not null
    check (direction in ('inbound', 'outbound')),
  summary text not null,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((client_id is not null) or (lead_id is not null))
);

alter table communication_log enable row level security;

create trigger communication_log_updated_at
  before update on communication_log
  for each row execute function set_updated_at();

-- Admin only
create policy "comms_select_admin" on communication_log
  for select using (is_admin());

create policy "comms_insert_admin" on communication_log
  for insert with check (is_admin());

create policy "comms_update_admin" on communication_log
  for update using (is_admin());

create policy "comms_delete_admin" on communication_log
  for delete using (is_admin());

-- Indexes
create index idx_comms_client on communication_log (client_id, occurred_at desc);
create index idx_comms_lead on communication_log (lead_id, occurred_at desc);

-- ---------------------------------------------------------------------------
-- admin_users
-- ---------------------------------------------------------------------------
create table admin_users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text unique not null,
  role text not null default 'owner'
    check (role in ('owner', 'employee')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table admin_users enable row level security;

create trigger admin_users_updated_at
  before update on admin_users
  for each row execute function set_updated_at();

-- Admin only
create policy "admin_users_select_admin" on admin_users
  for select using (is_admin());

create policy "admin_users_insert_admin" on admin_users
  for insert with check (is_admin());

create policy "admin_users_update_admin" on admin_users
  for update using (is_admin());

create policy "admin_users_delete_admin" on admin_users
  for delete using (is_admin());

-- ---------------------------------------------------------------------------
-- Table grants (required for PostgREST / Supabase client access)
-- ---------------------------------------------------------------------------

-- anon: read-only on services (public pricing)
grant select on services to anon;

-- authenticated: CRUD on own data, read on shared tables
grant select, insert, update, delete on clients to authenticated;
grant select, insert, update, delete on client_addresses to authenticated;
grant select, insert, update, delete on vehicles to authenticated;
grant select on services to authenticated;
grant select, insert, update on bookings to authenticated;
grant select, insert on booking_services to authenticated;
grant select on booking_photos to authenticated;
grant select, insert, update, delete on leads to authenticated;
grant select, insert, update, delete on communication_log to authenticated;
grant select on admin_users to authenticated;

-- service_role: full access (bypasses RLS, used by admin scripts)
grant all on clients to service_role;
grant all on client_addresses to service_role;
grant all on vehicles to service_role;
grant all on services to service_role;
grant all on bookings to service_role;
grant all on booking_services to service_role;
grant all on booking_photos to service_role;
grant all on leads to service_role;
grant all on communication_log to service_role;
grant all on admin_users to service_role;

-- ---------------------------------------------------------------------------
-- Seed: services
-- ---------------------------------------------------------------------------
insert into services (slug, name, description, category, base_price_cents, is_addon, display_order) values
  ('auto-exterior-only',       'Exterior Only',          'Full exterior wash, clay bar, and hand dry.',                'auto',   12000, false, 1),
  ('auto-interior-only',       'Interior Only',          'Full interior vacuum, wipe-down, and glass cleaning.',       'auto',   15000, false, 2),
  ('auto-full-detail',         'Full Detail',            'Complete interior and exterior detail.',                      'auto',   22500, false, 3),
  ('addon-paint-sealant',      'Paint Sealant',          'Ceramic-grade paint sealant for long-lasting protection.',   'auto',   35000, true,  4),
  ('addon-engine-bay',         'Engine Bay',             'Engine bay degrease and detail.',                            'auto',    7500, true,  5),
  ('addon-headlight-restore',  'Headlight Restoration',  'UV-damaged headlight lens restoration.',                     'auto',    9000, true,  6),
  ('marine-detailing',         'Boat & Jetski Detailing','Full marine detailing for boats and jet skis.',              'marine',  40000, false, 7),
  ('home-pressure-washing',    'Pressure Washing',       'Driveway, patio, and siding pressure washing.',              'home',   25000, false, 8),
  ('home-fence-window',        'Fence & Window Cleaning','Fence washing and exterior window cleaning.',                'home',   15000, false, 9);
