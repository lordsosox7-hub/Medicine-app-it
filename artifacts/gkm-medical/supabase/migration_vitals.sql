-- =====================================================================
-- Migration: vital_readings table for cloud-synced vital signs
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to run multiple times.
-- =====================================================================

create table if not exists vital_readings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  type text not null check (type in ('heart_rate','blood_pressure','blood_sugar','weight','temperature','oxygen')),
  value text not null,
  note text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_vital_readings_user
  on vital_readings(user_id, recorded_at desc);

alter table vital_readings enable row level security;

drop policy if exists "vital_readings anon all" on vital_readings;
create policy "vital_readings anon all"
  on vital_readings for all
  using (true) with check (true);
