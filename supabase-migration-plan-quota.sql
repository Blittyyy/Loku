-- Migration: Add plan and SMS quota tracking to users table
-- Run this in Supabase SQL Editor

-- Add plan and quota columns to users table
alter table users
  add column if not exists plan text not null default 'free',
  add column if not exists monthly_sms_count integer not null default 0,
  add column if not exists monthly_sms_limit integer not null default 30,
  add column if not exists last_reset_at timestamptz default now();

-- Add check constraint for plan values
alter table users
  add constraint users_plan_check check (plan in ('free', 'plus', 'pro'));

-- Create index for faster lookups
create index if not exists idx_users_plan on users(plan);

-- Function to reset monthly counts (can be called via cron or manually)
create or replace function reset_monthly_sms_counts()
returns void
language plpgsql
as $$
begin
  update users
  set monthly_sms_count = 0,
      last_reset_at = now()
  where last_reset_at < date_trunc('month', now())
     or last_reset_at is null;
end;
$$;

-- Function to get user quota info
create or replace function get_user_quota(user_uuid uuid)
returns json
language plpgsql
as $$
declare
  result json;
begin
  select json_build_object(
    'plan', plan,
    'monthly_sms_count', monthly_sms_count,
    'monthly_sms_limit', monthly_sms_limit,
    'remaining', monthly_sms_limit - monthly_sms_count,
    'last_reset_at', last_reset_at
  ) into result
  from users
  where id = user_uuid;
  
  return result;
end;
$$;

