-- =========================
-- Payments verification table
-- =========================
-- Stores manual transfer attempts (Bankak, OCash, Fawry, My Cashy)
-- which require admin confirmation before the appointment is marked paid.

create table if not exists payments (
  id uuid primary key default uuid_generate_v4(),
  appointment_id uuid not null references appointments(id) on delete cascade,
  user_id uuid not null,
  doctor_id uuid not null references doctors(id) on delete cascade,
  amount numeric not null default 0,
  method text not null,
  txn_ref text,
  status text not null default 'pending'
    check (status in ('pending','confirmed','rejected')),
  rejection_reason text,
  created_at timestamptz not null default now(),
  confirmed_at timestamptz,
  rejected_at timestamptz
);

create index if not exists idx_payments_appointment on payments(appointment_id);
create index if not exists idx_payments_user on payments(user_id, created_at desc);
create index if not exists idx_payments_status on payments(status, created_at desc);

alter table payments enable row level security;

drop policy if exists "payments anon all" on payments;
create policy "payments anon all" on payments for all using (true) with check (true);

-- Stream status updates to clients waiting on the verification screen
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'payments'
  ) then
    alter publication supabase_realtime add table payments;
  end if;
end $$;
