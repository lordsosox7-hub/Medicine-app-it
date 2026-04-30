-- Allow admin console to insert, update and delete doctors.
-- Run this in your Supabase dashboard → SQL Editor.

drop policy if exists "doctors anon insert" on doctors;
create policy "doctors anon insert" on doctors
  for insert with check (true);

drop policy if exists "doctors anon update" on doctors;
create policy "doctors anon update" on doctors
  for update using (true) with check (true);

drop policy if exists "doctors anon delete" on doctors;
create policy "doctors anon delete" on doctors
  for delete using (true);
