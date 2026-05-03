-- ============================================================
-- Migration: Add refunds table + no_show appointment status
-- Run this in your Supabase SQL Editor
-- ============================================================

-- 1. Drop existing status constraint so we can add no_show
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('upcoming', 'completed', 'cancelled', 'no_show'));

-- 2. Create refunds table
CREATE TABLE IF NOT EXISTS refunds (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id  uuid        NOT NULL,
  payment_id      uuid,
  user_id         text        NOT NULL,
  original_amount numeric     NOT NULL,
  fee_amount      numeric     NOT NULL,
  refund_amount   numeric     NOT NULL,
  reason          text        NOT NULL DEFAULT 'patient_cancelled',
  status          text        NOT NULL DEFAULT 'pending',
  created_at      timestamptz DEFAULT now(),
  processed_at    timestamptz,
  CONSTRAINT refunds_status_check CHECK (status IN ('pending', 'processed', 'rejected'))
);

-- 3. Enable Row Level Security (permissive — matching existing tables)
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public select refunds"  ON refunds FOR SELECT USING (true);
CREATE POLICY "Public insert refunds"  ON refunds FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update refunds"  ON refunds FOR UPDATE USING (true);
