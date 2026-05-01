-- Add a server-side notifications table so payment approvals/rejections
-- are persisted and appear in the user's notification feed.
-- Run this in your Supabase dashboard → SQL Editor.

create table if not exists notifications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     text        not null,
  kind        text        not null default 'payment',
  title_ar    text        not null,
  body_ar     text        not null,
  ref_id      text,
  read        boolean     not null default false,
  created_at  timestamptz not null default now()
);

alter table notifications enable row level security;

drop policy if exists "notifications anon all" on notifications;
create policy "notifications anon all" on notifications
  for all using (true) with check (true);
