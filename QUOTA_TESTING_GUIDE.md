# Testing the Quota System

This guide walks you through testing the plan/quota system to ensure it works correctly.

## Prerequisites

1. ✅ SQL migration has been run (`supabase-migration-plan-quota.sql`)
2. ✅ Edge Function `send-bulk` is deployed
3. ✅ You have at least one contact group with confirmed contacts
4. ✅ Twilio credentials are configured in Supabase secrets

## Test 1: Quota Enforcement (Limit Reached)

**Goal:** Verify that users cannot send messages when they've reached their monthly limit.

### Steps:

1. **Find your user ID:**
   - Go to Supabase Dashboard → Table Editor → `users`
   - Find your user record (or create one if needed)
   - Copy the `id` (UUID)

2. **Set quota to limit:**
   - In Supabase SQL Editor, run:
   ```sql
   UPDATE users
   SET monthly_sms_count = monthly_sms_limit,
       plan = 'free',
       monthly_sms_limit = 30
   WHERE id = 'YOUR_USER_ID_HERE';
   ```
   Replace `YOUR_USER_ID_HERE` with your actual user ID.

3. **Test in app:**
   - Open the Loku app
   - Tap the 🚗 Car FAB button
   - Select a Quick Action that uses "Loku (Twilio)" delivery method
   - Tap to send

4. **Expected Result:**
   - ❌ Message should NOT be sent
   - ✅ Upgrade prompt modal should appear
   - ✅ Modal shows: "You've used 30 of 30 SMS messages this month"
   - ✅ Modal displays available upgrade plans (Plus, Pro)

### Verify in Database:

```sql
-- Check that count didn't increase
SELECT monthly_sms_count, monthly_sms_limit, plan
FROM users
WHERE id = 'YOUR_USER_ID_HERE';
```

Should still show `monthly_sms_count = 30` (unchanged).

---

## Test 2: Quota Increment (Successful Send)

**Goal:** Verify that quota count increases after successful message sends.

### Steps:

1. **Reset quota to allow sending:**
   ```sql
   UPDATE users
   SET monthly_sms_count = 0,
       monthly_sms_limit = 30,
       plan = 'free'
   WHERE id = 'YOUR_USER_ID_HERE';
   ```

2. **Check current count:**
   ```sql
   SELECT monthly_sms_count, monthly_sms_limit
   FROM users
   WHERE id = 'YOUR_USER_ID_HERE';
   ```
   Should show `monthly_sms_count = 0`.

3. **Send a Quick Action:**
   - In app, tap 🚗 Car FAB
   - Select a Quick Action with "Loku (Twilio)" delivery
   - Ensure the contact group has at least 2-3 confirmed contacts
   - Send the message

4. **Expected Result:**
   - ✅ Message sends successfully
   - ✅ Success alert: "Message sent to X contact(s)!"
   - ✅ Quota count increases by number of recipients

5. **Verify in Database:**
   ```sql
   SELECT monthly_sms_count, monthly_sms_limit
   FROM users
   WHERE id = 'YOUR_USER_ID_HERE';
   ```
   Should show `monthly_sms_count = X` (where X = number of recipients who received the message).

---

## Test 3: Monthly Reset

**Goal:** Verify that quota resets automatically when a new month starts.

### Steps:

1. **Set last_reset_at to previous month:**
   ```sql
   UPDATE users
   SET last_reset_at = (NOW() - INTERVAL '1 month')::timestamptz,
       monthly_sms_count = 25
   WHERE id = 'YOUR_USER_ID_HERE';
   ```

2. **Send a Quick Action:**
   - In app, send a Quick Action via Loku (Twilio)

3. **Expected Result:**
   - ✅ Message sends successfully
   - ✅ Quota count should be reset to 0, then increment by recipient count
   - ✅ `last_reset_at` should update to current timestamp

4. **Verify in Database:**
   ```sql
   SELECT monthly_sms_count, last_reset_at
   FROM users
   WHERE id = 'YOUR_USER_ID_HERE';
   ```
   - `monthly_sms_count` should be the number of recipients (not 25 + recipients)
   - `last_reset_at` should be today's date/time

---

## Test 4: Different Plan Limits

**Goal:** Verify that different plans have different limits.

### Steps:

1. **Test Plus Plan (200 limit):**
   ```sql
   UPDATE users
   SET plan = 'plus',
       monthly_sms_limit = 200,
       monthly_sms_count = 199
   WHERE id = 'YOUR_USER_ID_HERE';
   ```

2. **Try to send:**
   - Send a Quick Action to a group with 2+ contacts
   - Should fail (199 + 2 = 201 > 200)

3. **Test Pro Plan (1000 limit):**
   ```sql
   UPDATE users
   SET plan = 'pro',
       monthly_sms_limit = 1000,
       monthly_sms_count = 999
   WHERE id = 'YOUR_USER_ID_HERE';
   ```

4. **Try to send:**
   - Send a Quick Action to a group with 1 contact
   - Should succeed (999 + 1 = 1000 ≤ 1000)

---

## Test 5: Edge Function Error Response

**Goal:** Verify the Edge Function returns correct error format when quota is exceeded.

### Steps:

1. **Set quota to limit:**
   ```sql
   UPDATE users
   SET monthly_sms_count = 30,
       monthly_sms_limit = 30,
       plan = 'free'
   WHERE id = 'YOUR_USER_ID_HERE';
   ```

2. **Check Edge Function logs:**
   - Go to Supabase Dashboard → Edge Functions → `send-bulk` → Logs
   - Send a Quick Action from the app
   - Check the logs for the error response

3. **Expected Error Response:**
   ```json
   {
     "error": "QUOTA_EXCEEDED",
     "message": "Monthly SMS limit reached. You've used 30 of 30 messages.",
     "plan": "free",
     "used": 30,
     "limit": 30,
     "remaining": 0
   }
   ```

4. **Verify Status Code:**
   - Should be HTTP 403 (Forbidden)

---

## Test 6: Preview Mode (No Quota Check)

**Goal:** Verify that preview mode doesn't check or increment quota.

### Steps:

1. **Set quota to limit:**
   ```sql
   UPDATE users
   SET monthly_sms_count = 30,
       monthly_sms_limit = 30
   WHERE id = 'YOUR_USER_ID_HERE';
   ```

2. **Call Edge Function with preview_only:**
   - You can test this via Supabase Dashboard → Edge Functions → `send-bulk` → Invoke
   - Use payload:
   ```json
   {
     "group_id": "your-group-id",
     "message": "Test",
     "preview_only": true
   }
   ```

3. **Expected Result:**
   - ✅ Should return success (200)
   - ✅ Response includes `preview: true` and `recipients_count`
   - ✅ Quota count should NOT increment

4. **Verify in Database:**
   ```sql
   SELECT monthly_sms_count
   FROM users
   WHERE id = 'YOUR_USER_ID_HERE';
   ```
   Should still be 30 (unchanged).

---

## Test 7: User Auto-Creation

**Goal:** Verify that user records are auto-created with defaults if missing.

### Steps:

1. **Delete user record (or use a non-existent user_id):**
   ```sql
   DELETE FROM users WHERE id = 'TEST_USER_ID';
   ```

2. **Send a Quick Action:**
   - Ensure the contact group's `user_id` matches the deleted user
   - Send a Quick Action via Loku

3. **Expected Result:**
   - ✅ Message sends successfully
   - ✅ New user record created with defaults:
     - `plan = 'free'`
     - `monthly_sms_count = 0`
     - `monthly_sms_limit = 30`
     - `last_reset_at = now()`

4. **Verify in Database:**
   ```sql
   SELECT * FROM users WHERE id = 'TEST_USER_ID';
   ```
   Should show a new record with default values.

---

## Test 8: SMS Composer Bypass

**Goal:** Verify that native SMS composer doesn't check quota.

### Steps:

1. **Set quota to limit:**
   ```sql
   UPDATE users
   SET monthly_sms_count = 30,
       monthly_sms_limit = 30
   WHERE id = 'YOUR_USER_ID_HERE';
   ```

2. **Send via SMS Composer:**
   - In app, create/edit a Quick Action
   - Set delivery method to "SMS Composer"
   - Send the Quick Action

3. **Expected Result:**
   - ✅ Native SMS app opens (no quota check)
   - ✅ Quota count should NOT increment
   - ✅ No upgrade prompt shown

---

## Quick Test Checklist

Use this checklist to verify all functionality:

- [ ] Quota blocks sending when limit reached
- [ ] Upgrade prompt appears when quota exceeded
- [ ] Quota count increments after successful send
- [ ] Monthly reset works (count resets to 0, then increments)
- [ ] Different plan limits work (free: 30, plus: 200, pro: 1000)
- [ ] Edge Function returns correct error format (QUOTA_EXCEEDED)
- [ ] Preview mode doesn't check or increment quota
- [ ] User records auto-create with defaults
- [ ] SMS Composer bypasses quota check

---

## Troubleshooting

### Quota not blocking sends?

1. Check Edge Function logs for errors
2. Verify user record exists and has correct `monthly_sms_count`
3. Ensure `send-bulk` function is using the latest deployed version
4. Check that `user_id` is being correctly identified

### Upgrade prompt not showing?

1. Check browser/app console for errors
2. Verify error response format from Edge Function
3. Check that `QuickActionsFAB` is handling `QUOTA_EXCEEDED` error
4. Ensure `UpgradePrompt` component is imported and rendered

### Quota count not incrementing?

1. Check Edge Function logs for errors during send
2. Verify Twilio messages are actually being sent (check Twilio logs)
3. Ensure `sentCount > 0` before quota update
4. Check database for updated `monthly_sms_count`

### Monthly reset not working?

1. Verify `last_reset_at` is set correctly
2. Check Edge Function logic for month comparison
3. Ensure timezone is handled correctly (uses UTC in Supabase)

---

## SQL Helper Queries

Use these queries to quickly check and modify quota:

```sql
-- View current quota for a user
SELECT 
  id,
  plan,
  monthly_sms_count,
  monthly_sms_limit,
  (monthly_sms_limit - monthly_sms_count) as remaining,
  last_reset_at
FROM users
WHERE id = 'YOUR_USER_ID_HERE';

-- Reset quota to 0
UPDATE users
SET monthly_sms_count = 0
WHERE id = 'YOUR_USER_ID_HERE';

-- Set quota to limit (for testing)
UPDATE users
SET monthly_sms_count = monthly_sms_limit
WHERE id = 'YOUR_USER_ID_HERE';

-- Change plan
UPDATE users
SET plan = 'plus', monthly_sms_limit = 200
WHERE id = 'YOUR_USER_ID_HERE';

-- Simulate previous month (for reset testing)
UPDATE users
SET last_reset_at = (NOW() - INTERVAL '1 month')::timestamptz
WHERE id = 'YOUR_USER_ID_HERE';
```

