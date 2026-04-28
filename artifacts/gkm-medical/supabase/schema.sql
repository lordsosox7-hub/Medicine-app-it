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
  created_at timestamptz not null default now()
);

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
  full_name_ar text not null default 'أحمد محمد',
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

-- Indexes
create index if not exists idx_appointments_user on appointments(user_id, appointment_date);
create index if not exists idx_messages_conversation on messages(conversation_id, created_at);
create index if not exists idx_lab_results_user on lab_results(user_id, test_date desc);
create index if not exists idx_doctors_category on doctors(category);

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

-- =========================
-- Seed: doctors
-- =========================
insert into doctors (name_ar, specialty_ar, category, photo_url, rating, years_experience, about_ar, services_ar, price) values
  ('د. محمد السعيد', 'استشاري أمراض القلب والأوعية الدموية', 'heart', 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&q=80', 4.9, 15, 'استشاري في أمراض القلب والأوعية الدموية، متخصص في تشخيص وعلاج أمراض القلب وارتفاع ضغط الدم. حاصل على البورد العربي والزمالة الأوروبية في طب القلب.', ARRAY['متابعة الضغط','تخطيط القلب','علاج ارتفاع الكوليسترول','استشارات طبية'], 150),
  ('د. سارة أحمد', 'استشارية طب الأطفال وحديثي الولادة', 'kids', 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80', 4.8, 12, 'استشارية في طب الأطفال وحديثي الولادة، متخصصة في تطعيمات ومتابعة نمو الأطفال وعلاج أمراض الطفولة الشائعة.', ARRAY['الكشف العام','التطعيمات','متابعة النمو','استشارات أمهات'], 130),
  ('د. علي إبراهيم', 'استشاري الجهاز الهضمي والمناظير', 'general', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80', 4.7, 18, 'استشاري الجهاز الهضمي والكبد، متخصص في المناظير التشخيصية والعلاجية وعلاج أمراض القولون.', ARRAY['مناظير الجهاز الهضمي','علاج القولون العصبي','استشارات الكبد'], 180),
  ('د. ندى حسن', 'استشارية الجلدية والتجميل', 'women', 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=400&q=80', 4.9, 10, 'استشارية الأمراض الجلدية وعلاجات التجميل غير الجراحية، خبرة واسعة في علاج حب الشباب والبشرة.', ARRAY['علاج حب الشباب','تنظيف البشرة','حقن البلازما','استشارات تجميل'], 200),
  ('د. خالد المطيري', 'أخصائي طب الأسنان وتقويم', 'dental', 'https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=400&q=80', 4.6, 8, 'أخصائي طب الأسنان وتقويم الأسنان، متخصص في الزراعة وتجميل الأسنان.', ARRAY['تقويم الأسنان','زراعة الأسنان','تبييض','حشوات تجميلية'], 170),
  ('د. منى الرشيد', 'استشارية أمراض النساء والولادة', 'women', 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=400&q=80', 4.8, 14, 'استشارية أمراض النساء والولادة، متابعة الحمل والرعاية النسائية الشاملة.', ARRAY['متابعة الحمل','الفحص الدوري','استشارات الخصوبة'], 160)
on conflict do nothing;

-- =========================
-- Helper: create demo data for a given user_id
-- Call from app after first launch:  select gkm_seed_demo_data('uuid-here');
-- =========================
create or replace function gkm_seed_demo_data(p_user_id uuid)
returns void
language plpgsql
as $$
declare
  d_heart uuid;
  d_kids  uuid;
  conv_id uuid;
begin
  select id into d_heart from doctors where category='heart' limit 1;
  select id into d_kids  from doctors where category='kids'  limit 1;

  -- Medical file (one per user)
  insert into medical_files (user_id, full_name_ar, age, gender, blood_type,
    allergies, chronic_diseases, current_medications, past_surgeries, vaccinations)
  values (p_user_id, 'أحمد محمد', 28, 'ذكر', 'O+',
    ARRAY['حساسية البنسلين','حساسية المكسرات'],
    ARRAY['ارتفاع ضغط الدم'],
    ARRAY['لوسارتان 50 ملغ','أسبرين 81 ملغ'],
    ARRAY['استئصال الزائدة الدودية - 2018'],
    ARRAY['لقاح كوفيد-19','لقاح الإنفلونزا الموسمي','لقاح التيتانوس']
  )
  on conflict (user_id) do nothing;

  -- Lab results
  insert into lab_results (user_id, test_name_ar, test_type, test_date, status, result_value, unit, reference_range) values
    (p_user_id, 'صورة دم كاملة (CBC)', 'blood', current_date - 5,  'normal', '14.2', 'g/dL', '13.5-17.5'),
    (p_user_id, 'سكر صائم (FBS)',       'blood', current_date - 12, 'normal', '92',   'mg/dL','70-100'),
    (p_user_id, 'الكوليسترول الكلي',     'blood', current_date - 20, 'high',   '235',  'mg/dL','<200'),
    (p_user_id, 'تحليل بول كامل',         'urine', current_date - 30, 'normal', 'سليم', null,   '—')
  on conflict do nothing;

  -- Upcoming appointment
  if d_heart is not null then
    insert into appointments (user_id, doctor_id, appointment_date, appointment_time, status)
    values (p_user_id, d_heart, current_date + 2, '10:30 صباحاً', 'upcoming')
    on conflict do nothing;
  end if;

  -- A demo conversation with a doctor
  if d_kids is not null then
    insert into conversations (user_id, doctor_id, last_message, last_message_at)
    values (p_user_id, d_kids, 'أين يمكنني شراء وسائل ما تنصحين؟', now() - interval '5 minutes')
    on conflict (user_id, doctor_id) do update
      set last_message = excluded.last_message, last_message_at = excluded.last_message_at
    returning id into conv_id;

    if conv_id is not null then
      insert into messages (conversation_id, doctor_id, user_id, sender, text, created_at) values
        (conv_id, d_kids, p_user_id, 'doctor', 'مرحباً، كيف يمكنني مساعدتك اليوم؟', now() - interval '20 minutes'),
        (conv_id, d_kids, p_user_id, 'user',   'لدي بعض الأعراض، أحتاج استشارة سريعة.', now() - interval '15 minutes'),
        (conv_id, d_kids, p_user_id, 'doctor', 'بكل تأكيد، صفي لي الأعراض من فضلك.', now() - interval '10 minutes'),
        (conv_id, d_kids, p_user_id, 'user',   'أين يمكنني شراء وسائل ما تنصحين؟', now() - interval '5 minutes')
      on conflict do nothing;
    end if;
  end if;
end;
$$;

-- Enable realtime on messages so doctor replies stream into the chat instantly
alter publication supabase_realtime add table messages;

-- Read receipts: timestamp set when the recipient has seen the message
alter table messages add column if not exists read_at timestamptz;
