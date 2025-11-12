# Plan & Quota System Implementation

This document describes the implementation of the subscription plan and monthly SMS quota system for Loku.

## Overview

The system enforces monthly SMS limits based on user subscription plans:
- **Free**: 30 messages/month
- **Plus**: 200 messages/month  
- **Pro**: 1000 messages/month

When users exceed their quota, they see an upgrade prompt instead of being able to send messages.

## Database Schema

### Migration File: `supabase-migration-plan-quota.sql`

Run this SQL in your Supabase SQL Editor to add plan/quota columns to the `users` table:

```sql
-- Add plan and quota columns
alter table users
  add column if not exists plan text not null default 'free',
  add column if not exists monthly_sms_count integer not null default 0,
  add column if not exists monthly_sms_limit integer not null default 30,
  add column if not exists last_reset_at timestamptz default now();

-- Add check constraint
alter table users
  add constraint users_plan_check check (plan in ('free', 'plus', 'pro'));
```

### Schema Changes

The `users` table now includes:
- `plan`: 'free' | 'plus' | 'pro' (default: 'free')
- `monthly_sms_count`: Current count for the month (default: 0)
- `monthly_sms_limit`: Limit based on plan (default: 30)
- `last_reset_at`: Timestamp of last monthly reset

## Edge Function: `send-bulk`

### Quota Enforcement

The `send-bulk` Edge Function (`supabase/functions/send-bulk/index.ts`) now:

1. **Gets user_id** from auth token or contact group
2. **Fetches/creates user record** with default free plan if missing
3. **Resets monthly count** if a new month has started
4. **Checks quota** before sending:
   - If `monthly_sms_count + recipient_count > monthly_sms_limit`, returns `QUOTA_EXCEEDED` error
5. **Increments quota** after successful sends
6. **Returns quota info** in response for client-side display

### Error Response Format

When quota is exceeded:
```json
{
  "error": "QUOTA_EXCEEDED",
  "message": "Monthly SMS limit reached. You've used X of Y messages.",
  "plan": "free",
  "used": 30,
  "limit": 30,
  "remaining": 0
}
```

## Client-Side Implementation

### Store: `usePlanQuota`

Location: `src/store/usePlanQuota.ts`

Manages quota state and provides:
- `fetchQuota(userId)`: Fetch current quota from database
- `refreshQuota(userId)`: Refresh quota after sending
- `getRemaining()`: Get remaining messages
- `isQuotaExceeded(count)`: Check if sending would exceed quota

### Component: `UpgradePrompt`

Location: `src/components/UpgradePrompt.tsx`

Modal that displays when quota is exceeded, showing:
- Current usage (X of Y messages)
- Available upgrade plans
- Placeholder for payment integration

### Integration: `QuickActionsFAB`

Location: `src/components/QuickActionsFAB.tsx`

Updated to:
1. Fetch quota when modal opens
2. Handle `QUOTA_EXCEEDED` errors from Edge Function
3. Show `UpgradePrompt` when quota exceeded
4. Refresh quota after successful sends

## Usage Flow

### Sending a Quick Action (Loku/Twilio)

1. User taps Quick Action
2. `QuickActionsFAB` calls `send-bulk` Edge Function
3. Edge Function checks quota:
   - ✅ **Within limit**: Sends messages, increments count, returns success
   - ❌ **Exceeded**: Returns `QUOTA_EXCEEDED` error (403)
4. Client handles response:
   - Success: Shows "Message Sent!" alert, refreshes quota
   - Quota exceeded: Shows `UpgradePrompt` modal

### SMS Composer (No Quota Check)

When using the native SMS composer (`delivery_method: 'composer'`), no quota is enforced since messages are sent directly through the device's SMS app.

## Monthly Reset

The Edge Function automatically resets `monthly_sms_count` to 0 when:
- `last_reset_at` is null, OR
- Current month/year differs from `last_reset_at` month/year

This happens on-demand when the function is called, ensuring accurate counts.

## Plan Limits

Defined in `src/store/usePlanQuota.ts`:

```typescript
const PLAN_LIMITS: Record<Plan, number> = {
  free: 30,
  plus: 200,
  pro: 1000,
};
```

To change limits, update this constant and ensure the database `monthly_sms_limit` is updated accordingly.

## Future Enhancements

1. **Payment Integration**: Replace placeholder in `UpgradePrompt.onUpgrade()` with actual payment processing (Stripe, RevenueCat, etc.)

2. **Plan Management UI**: Add settings screen to:
   - View current plan and usage
   - Upgrade/downgrade plans
   - See usage history

3. **Usage Analytics**: Track and display:
   - Messages sent per day/week/month
   - Most used quick actions
   - Peak usage times

4. **Proactive Quota Warnings**: Show warning at 80% and 95% usage

5. **Automatic Monthly Reset**: Set up Supabase cron job to reset all users' counts at start of month

## Testing

### Test Quota Enforcement

1. Set a user's `monthly_sms_count` to their `monthly_sms_limit` in Supabase
2. Try to send a Quick Action via Loku
3. Should see `UpgradePrompt` instead of sending

### Test Monthly Reset

1. Set `last_reset_at` to previous month in Supabase
2. Send a Quick Action
3. Check that `monthly_sms_count` resets to 0, then increments

### Test Quota Increment

1. Send a Quick Action to a group with 3 contacts
2. Check that `monthly_sms_count` increases by 3 in Supabase

## Notes

- Quota only applies to messages sent via **Loku (Twilio)** delivery method
- Native SMS composer bypasses quota (sent through device)
- Quota is checked server-side in Edge Function (cannot be bypassed)
- User records are auto-created with free plan defaults if missing

