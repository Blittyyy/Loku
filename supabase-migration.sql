-- Migration: Add custom_sound_uri column to triggers table and Safety Mode features
-- Run this in your Supabase SQL Editor if you've already created the triggers table

-- Add the custom_sound_uri column
ALTER TABLE triggers 
ADD COLUMN IF NOT EXISTS custom_sound_uri text;

-- Add Safety Mode column to triggers
ALTER TABLE triggers 
ADD COLUMN IF NOT EXISTS notify_contacts boolean default false;

-- Create trusted_contacts table
CREATE TABLE IF NOT EXISTS trusted_contacts (
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

-- Enable RLS for trusted_contacts
ALTER TABLE trusted_contacts ENABLE ROW LEVEL SECURITY;

-- Simple permissive policy for dev (adjust for prod)
-- Drop if exists, then create
DROP POLICY IF EXISTS "dev contacts" ON trusted_contacts;
CREATE POLICY "dev contacts" ON trusted_contacts 
  FOR ALL USING (true) WITH CHECK (true);

-- Verify the columns were added
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'triggers' AND column_name IN ('custom_sound_uri', 'notify_contacts');

