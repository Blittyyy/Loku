-- Loku Database Schema for Supabase
-- Run this SQL in your Supabase project's SQL Editor

-- users
create table if not exists users (
  id uuid primary key,
  email text unique,
  device_token text
);

-- places
create table if not exists places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  address text,
  lat double precision not null,
  lng double precision not null,
  radius integer not null default 200,
  outer_radius integer not null default 350,
  created_at timestamptz default now()
);

-- triggers
create table if not exists triggers (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references places(id) on delete cascade,
  type text check (type in ('arrival','departure')) not null,
  message text not null default 'Arrival reminder',
  sound_enabled boolean not null default true,
  custom_sound_uri text,
  notify_contacts boolean not null default false,
  enabled boolean not null default true,
  last_state text default 'outside',
  last_event_at timestamptz,
  last_alert_at timestamptz,
  dwell_ms integer not null default 120000,
  out_confirm_ms integer not null default 300000,
  cooldown_ms integer not null default 600000,
  created_at timestamptz default now()
);

-- trusted_contacts
create table if not exists trusted_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  phone text,
  email text,
  confirmed boolean default false,
  share_arrival boolean default true,
  share_departure boolean default true,
  created_at timestamptz default now()
);

-- trigger_logs
create table if not exists trigger_logs (
  id uuid primary key default gen_random_uuid(),
  place_name text,
  event_type text check (event_type in ('arrival','departure')),
  timestamp timestamptz default now()
);

-- contact_groups
create table if not exists contact_groups (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  created_at timestamptz default now()
);

-- contact_group_members
create table if not exists contact_group_members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references contact_groups(id) on delete cascade,
  contact_id uuid references trusted_contacts(id) on delete cascade,
  created_at timestamptz default now(),
  unique(group_id, contact_id)
);

-- quick_actions
create table if not exists quick_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  name text not null,
  group_id uuid references contact_groups(id) on delete cascade,
  message text not null,
  delivery_method text check (delivery_method in ('composer', 'loku')) not null default 'composer',
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table places enable row level security;
alter table triggers enable row level security;
alter table trigger_logs enable row level security;
alter table trusted_contacts enable row level security;
alter table contact_groups enable row level security;
alter table contact_group_members enable row level security;
alter table quick_actions enable row level security;

-- Simple permissive RLS for dev (adjust for prod)
drop policy if exists "dev places" on places;
drop policy if exists "dev triggers" on triggers;
drop policy if exists "dev logs" on trigger_logs;
drop policy if exists "dev contacts" on trusted_contacts;
drop policy if exists "dev contact_groups" on contact_groups;
drop policy if exists "dev contact_group_members" on contact_group_members;
drop policy if exists "dev quick_actions" on quick_actions;

create policy "dev places" on places for all using (true) with check (true);
create policy "dev triggers" on triggers for all using (true) with check (true);
create policy "dev logs" on trigger_logs for all using (true) with check (true);
create policy "dev contacts" on trusted_contacts for all using (true) with check (true);
create policy "dev contact_groups" on contact_groups for all using (true) with check (true);
create policy "dev contact_group_members" on contact_group_members for all using (true) with check (true);
create policy "dev quick_actions" on quick_actions for all using (true) with check (true);

