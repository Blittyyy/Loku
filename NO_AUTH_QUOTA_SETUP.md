# Quota System Setup for Apps Without Authentication

Since Loku doesn't have user authentication, the quota system uses a **single default user** for all quota tracking.

## How It Works

1. **Default User ID**: The Edge Function uses a constant UUID (`00000000-0000-0000-0000-000000000001`) when no user is found
2. **Auto-Creation**: The user record is automatically created on first use with free plan defaults
3. **Shared Quota**: All users share the same quota (since there's no multi-user system)

## Setup Steps

### 1. Run the SQL Migration

Run `supabase-migration-plan-quota.sql` in Supabase SQL Editor to add quota columns.

### 2. Create Default User (Optional)

You can pre-create the default user, or it will be auto-created on first Quick Action send:

```sql
-- Create default user with free plan
INSERT INTO users (id, plan, monthly_sms_count, monthly_sms_limit, last_reset_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'free',
  0,
  30,
  NOW()
)
ON CONFLICT (id) DO NOTHING;
```

### 3. Test the System

1. Send a Quick Action via Loku (Twilio)
2. Check the `users` table - you should see the default user created
3. Check `monthly_sms_count` - it should increment with each send

## Viewing Quota

```sql
-- View current quota for default user
SELECT 
  plan,
  monthly_sms_count,
  monthly_sms_limit,
  (monthly_sms_limit - monthly_sms_count) as remaining,
  last_reset_at
FROM users
WHERE id = '00000000-0000-0000-0000-000000000001';
```

## Changing the Default User ID

If you want to use a different UUID, update it in:
- `supabase/functions/send-bulk/index.ts` (line ~59)
- Any SQL queries that reference the user ID

## Testing Quota Limits

```sql
-- Set quota to limit (to test blocking)
UPDATE users
SET monthly_sms_count = 30,
    monthly_sms_limit = 30
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Reset quota
UPDATE users
SET monthly_sms_count = 0
WHERE id = '00000000-0000-0000-0000-000000000001';

-- Change plan
UPDATE users
SET plan = 'plus', monthly_sms_limit = 200
WHERE id = '00000000-0000-0000-0000-000000000001';
```

## Future: Multi-User Support

If you add authentication later, the system will automatically:
1. Use the authenticated user's ID from the auth token
2. Fall back to contact group's `user_id` if available
3. Only use the default user ID as a last resort

No code changes needed - it already supports this flow!

