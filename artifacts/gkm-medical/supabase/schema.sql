-- =====================================================================
-- GKM's Unit Medical Care — Supabase schema + seed data
-- Run this entire file in your Supabase SQL Editor (Dashboard → SQL Editor)
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- =========================
-- Tables
-- =========================

create table if not exists doctors (
  id uuid primary key default uuid_generate_v4(),
  name_ar text not null,
  specialty_ar text not null,
  category text not null check (category in ('heart','dental','kids','women','general')),
  photo_url text,
  rating numeric(2,1) not null default 4.5,
  years_experience int not null default 0,
  about_ar text not null default '',
  services_ar text[] not null default '{}',
  price numeric(10,2) not null default 150,
  clinic_name_ar text,
  clinic_address_ar text,
  clinic_phone text,
  clinic_maps_url text,
  created_at timestamptz not null default now()
);

-- Backfill columns for existing databases
alter table doctors add column if not exists clinic_name_ar text;
alter table doctors add column if not exists clinic_address_ar text;
alter table doctors add column if not exists clinic_phone text;
alter table doctors add column if not exists clinic_maps_url text;

create table if not exists appointments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  doctor_id uuid not null references doctors(id) on delete cascade,
  appointment_date date not null,
  appointment_time text not null,
  status text not null default 'upcoming' check (status in ('upcoming','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  doctor_id uuid not null references doctors(id) on delete cascade,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, doctor_id)
);

create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  doctor_id uuid not null references doctors(id),
  user_id uuid not null,
  sender text not null check (sender in ('user','doctor')),
  text text not null,
  created_at timestamptz not null default now()
);

create table if not exists medical_files (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null unique,
  full_name_ar text not null default '',
  age int not null default 28,
  gender text not null default 'ذكر',
  blood_type text not null default 'O+',
  allergies text[] not null default '{}',
  chronic_diseases text[] not null default '{}',
  current_medications text[] not null default '{}',
  past_surgeries text[] not null default '{}',
  vaccinations text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists lab_results (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  test_name_ar text not null,
  test_type text not null check (test_type in ('blood','urine','other')),
  test_date date not null,
  status text not null check (status in ('normal','high','low')),
  result_value text not null,
  unit text,
  reference_range text,
  created_at timestamptz not null default now()
);

create table if not exists vital_readings (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  type text not null check (type in ('heart_rate','blood_pressure','blood_sugar','weight','temperature','oxygen')),
  value text not null,
  note text,
  recorded_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_appointments_user on appointments(user_id, appointment_date);
create index if not exists idx_messages_conversation on messages(conversation_id, created_at);
create index if not exists idx_lab_results_user on lab_results(user_id, test_date desc);
create index if not exists idx_doctors_category on doctors(category);
create index if not exists idx_vital_readings_user on vital_readings(user_id, recorded_at desc);

-- =========================
-- Row Level Security
-- =========================
-- For the demo app we use anonymous user IDs. Enable RLS and allow public
-- read on doctors, full access on user-scoped tables. Tighten as needed.

alter table doctors enable row level security;
alter table appointments enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table medical_files enable row level security;
alter table lab_results enable row level security;
alter table vital_readings enable row level security;

drop policy if exists "doctors public read" on doctors;
create policy "doctors public read" on doctors for select using (true);

drop policy if exists "appointments anon all" on appointments;
create policy "appointments anon all" on appointments for all using (true) with check (true);

drop policy if exists "conversations anon all" on conversations;
create policy "conversations anon all" on conversations for all using (true) with check (true);

drop policy if exists "messages anon all" on messages;
create policy "messages anon all" on messages for all using (true) with check (true);

drop policy if exists "medical_files anon all" on medical_files;
create policy "medical_files anon all" on medical_files for all using (true) with check (true);

drop policy if exists "lab_results anon all" on lab_results;
create policy "lab_results anon all" on lab_results for all using (true) with check (true);

drop policy if exists "vital_readings anon all" on vital_readings;
create policy "vital_readings anon all" on vital_readings for all using (true) with check (true);

-- =========================
-- Seed: doctors
-- =========================
insert into doctors (name_ar, specialty_ar, category, photo_url, rating, years_experience, about_ar, services_ar, price, clinic_name_ar, clinic_address_ar, clinic_phone, clinic_maps_url) values
  ('د. محمد السعيد', 'استشاري أمراض القلب والأوعية الدموية', 'heart', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80', 4.9, 15, 'استشاري في أمراض القلب والأوعية الدموية، متخصص في تشخيص وعلاج أمراض القلب وارتفاع ضغط الدم. حاصل على البورد العربي والزمالة الأوروبية في طب القلب.', ARRAY['متابعة الضغط','تخطيط القلب','علاج ارتفاع الكوليسترول','استشارات طبية'], 150, 'مركز القلب التخصصي', 'برج العليا الطبي، الدور 5، شارع الملك فهد، حي العليا، الرياض', '+966112345671', 'https://www.google.com/maps/search/?api=1&query=Olaya+Medical+Tower+Riyadh'),
  ('د. سارة أحمد', 'استشارية طب الأطفال وحديثي الولادة', 'kids', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80', 4.8, 12, 'استشارية في طب الأطفال وحديثي الولادة، متخصصة في تطعيمات ومتابعة نمو الأطفال وعلاج أمراض الطفولة الشائعة.', ARRAY['الكشف العام','التطعيمات','متابعة النمو','استشارات أمهات'], 130, 'عيادات الأطفال السعيدة', 'مجمع الياسمين الطبي، طريق الأمير محمد بن عبدالعزيز، حي الياسمين، الرياض', '+966112345672', 'https://www.google.com/maps/search/?api=1&query=Yasmin+Medical+Complex+Riyadh'),
  ('د. علي إبراهيم', 'استشاري الجهاز الهضمي والمناظير', 'general', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80', 4.7, 18, 'استشاري الجهاز الهضمي والكبد، متخصص في المناظير التشخيصية والعلاجية وعلاج أمراض القولون.', ARRAY['مناظير الجهاز الهضمي','علاج القولون العصبي','استشارات الكبد'], 180, 'مركز المناظير المتقدم', 'مجمع التخصصي الطبي، شارع التحلية، حي السليمانية، الرياض', '+966112345673', 'https://www.google.com/maps/search/?api=1&query=Tahlia+Street+Riyadh'),
  ('د. ندى حسن', 'استشارية الجلدية والتجميل', 'women', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80', 4.9, 10, 'استشارية الأمراض الجلدية وعلاجات التجميل غير الجراحية، خبرة واسعة في علاج حب الشباب والبشرة.', ARRAY['علاج حب الشباب','تنظيف البشرة','حقن البلازما','استشارات تجميل'], 200, 'عيادة ندى للجلدية والتجميل', 'برج المملكة، الدور 12، طريق العروبة، حي العليا، الرياض', '+966112345674', 'https://www.google.com/maps/search/?api=1&query=Kingdom+Tower+Riyadh'),
  ('د. خالد المطيري', 'أخصائي طب الأسنان وتقويم', 'dental', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&q=80', 4.6, 8, 'أخصائي طب الأسنان وتقويم الأسنان، متخصص في الزراعة وتجميل الأسنان.', ARRAY['تقويم الأسنان','زراعة الأسنان','تبييض','حشوات تجميلية'], 170, 'عيادات الابتسامة الذهبية للأسنان', 'مجمع النخيل الطبي، شارع الأمير سلطان، حي النخيل، الرياض', '+966112345675', 'https://www.google.com/maps/search/?api=1&query=Al+Nakheel+Riyadh'),
  ('د. منى الرشيد', 'استشارية أمراض النساء والولادة', 'women', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80', 4.8, 14, 'استشارية أمراض النساء والولادة، متابعة الحمل والرعاية النسائية الشاملة.', ARRAY['متابعة الحمل','الفحص الدوري','استشارات الخصوبة'], 160, 'مركز الرشيد للنساء والولادة', 'مجمع الورود الطبي، طريق الملك عبدالله، حي الورود، الرياض', '+966112345676', 'https://www.google.com/maps/search/?api=1&query=Al+Wurud+Riyadh')
on conflict do nothing;

-- Backfill clinic info for existing doctor rows (matched by name)
update doctors set clinic_name_ar = 'مركز القلب التخصصي', clinic_address_ar = 'برج العليا الطبي، الدور 5، شارع الملك فهد، حي العليا، الرياض', clinic_phone = '+966112345671', clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Olaya+Medical+Tower+Riyadh' where name_ar = 'د. محمد السعيد' and clinic_address_ar is null;
update doctors set clinic_name_ar = 'عيادات الأطفال السعيدة', clinic_address_ar = 'مجمع الياسمين الطبي، طريق الأمير محمد بن عبدالعزيز، حي الياسمين، الرياض', clinic_phone = '+966112345672', clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Yasmin+Medical+Complex+Riyadh' where name_ar = 'د. سارة أحمد' and clinic_address_ar is null;
update doctors set clinic_name_ar = 'مركز المناظير المتقدم', clinic_address_ar = 'مجمع التخصصي الطبي، شارع التحلية، حي السليمانية، الرياض', clinic_phone = '+966112345673', clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Tahlia+Street+Riyadh' where name_ar = 'د. علي إبراهيم' and clinic_address_ar is null;
update doctors set clinic_name_ar = 'عيادة ندى للجلدية والتجميل', clinic_address_ar = 'برج المملكة، الدور 12، طريق العروبة، حي العليا، الرياض', clinic_phone = '+966112345674', clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Kingdom+Tower+Riyadh' where name_ar = 'د. ندى حسن' and clinic_address_ar is null;
update doctors set clinic_name_ar = 'عيادات الابتسامة الذهبية للأسنان', clinic_address_ar = 'مجمع النخيل الطبي، شارع الأمير سلطان، حي النخيل، الرياض', clinic_phone = '+966112345675', clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Al+Nakheel+Riyadh' where name_ar = 'د. خالد المطيري' and clinic_address_ar is null;
update doctors set clinic_name_ar = 'مركز الرشيد للنساء والولادة', clinic_address_ar = 'مجمع الورود الطبي، طريق الملك عبدالله، حي الورود، الرياض', clinic_phone = '+966112345676', clinic_maps_url = 'https://www.google.com/maps/search/?api=1&query=Al+Wurud+Riyadh' where name_ar = 'د. منى الرشيد' and clinic_address_ar is null;

-- Enable realtime on messages so doctor replies stream into the chat instantly
alter publication supabase_realtime add table messages;

-- Read receipts: timestamp set when the recipient has seen the message
alter table messages add column if not exists read_at timestamptz;

-- =========================
-- Favorites
-- =========================
create table if not exists favorites (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null,
  doctor_id uuid not null references doctors(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, doctor_id)
);

create index if not exists idx_favorites_user on favorites(user_id, created_at desc);

alter table favorites enable row level security;

drop policy if exists "favorites anon all" on favorites;
create policy "favorites anon all" on favorites for all using (true) with check (true);

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
