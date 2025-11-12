# Safety Mode Setup Guide for Loku

## Quick Start

### 1. Run Database Migration

Open your Supabase SQL Editor and run:

```sql
-- Add notify_contacts column to triggers
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS notify_contacts boolean DEFAULT false;

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

ALTER TABLE trusted_contacts enable row level security;

CREATE POLICY IF NOT EXISTS "dev contacts" ON trusted_contacts 
  FOR ALL USING (true) WITH CHECK (true);
```

Or use the file: `supabase-migration.sql`

### 2. Deploy Supabase Edge Function

**Install Supabase CLI** (if not already):
```bash
npm install -g supabase
```

**Deploy the function**:
```bash
cd supabase/functions/send-shared-alert
supabase functions deploy send-shared-alert
```

### 3. Configure Twilio

1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number
3. In Supabase Dashboard:
   - Go to **Edge Functions** → **send-shared-alert**
   - Click **Environment Variables**
   - Add:
     - `TWILIO_SID`: Your Account SID
     - `TWILIO_TOKEN`: Your Auth Token
     - `TWILIO_FROM`: Your Twilio phone number (format: +1234567890)

### 4. Use in App

**User Flow**:
1. Open Settings
2. Enable **Safety Mode** toggle
3. **Notify Contacts** auto-enables
4. Tap **+ Add** to add trusted contact
5. Enter name and phone number
6. Toggle arrival/departure sharing as desired
7. Go to Create Trigger
8. Check **Notify Contacts** checkbox
9. Save trigger

**Parent/Child Example**:
- Child creates "School" place
- Creates arrival trigger: "Arrive Safely" template
- Enables **Notify Contacts**
- Parent receives SMS when child arrives: "📍 School: I've arrived safely."

## How It Works

### Trigger Behavior

**With `notify_contacts=true`**:
1. Local notification still fires (for user)
2. Safety alert sent to contacts (SMS)
3. Both respect same cooldown/timing

**Without `notify_contacts`**:
- Only local notifications
- No remote alerts sent

### Hysteresis Protection

Safety alerts use same visit-based logic as local notifications:
- **Arrival**: Only after staying inside for 2min (dwell_ms)
- **Departure**: Only after staying outside for 5min (out_confirm_ms)
- **Loops**: No false alerts from GPS drift or brief exits

### Cooldown

Both local and remote alerts respect 10min cooldown to prevent duplicates.

## Testing

### Test Safety Alert
1. Add trusted contact with your phone number
2. Create trigger with "Notify Contacts" enabled
3. Simulate arrival/departure (or actually visit location)
4. Should receive SMS within a few seconds of confirmation

### Test Without Contact Sharing
1. Create trigger without "Notify Contacts"
2. Simulate event
3. Should only see local notification
4. No SMS sent

### Test Settings
1. Disable "Notify Contacts" in Settings
2. Even if trigger has notify_contacts=true
3. No alerts sent (Safety Mode can remain enabled)
4. Re-enable to restore alerts

## Cost Considerations

**Twilio Pricing**:
- SMS: ~$0.0075 per message in US
- 100 alerts = $0.75
- 1000 alerts = $7.50

**Supabase**: Edge Functions included in free tier

**Recommendation**: Track usage in Supabase dashboard, set budget alerts.

## Production Deployment

### Security Checklist

- [ ] Update RLS policies to restrict by user_id
- [ ] Add rate limiting to edge function
- [ ] Set up Twilio budget alerts
- [ ] Implement contact confirmation flow
- [ ] Add abuse detection
- [ ] Enable function request logging
- [ ] Set up monitoring/alerts

### Updated RLS Policy (Production)

```sql
-- Replace dev policy with user-scoped policy
DROP POLICY "dev contacts" ON trusted_contacts;

CREATE POLICY "user contacts" ON trusted_contacts 
  FOR SELECT USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## Troubleshooting

### SMS Not Received
- Check Twilio logs in dashboard
- Verify phone format: +1234567890
- Check Supabase function logs
- Ensure all toggles enabled
- Test with a known working number first

### Function Deployment Issues
```bash
# Check function logs
supabase functions logs send-shared-alert

# Test locally
supabase functions serve send-shared-alert
```

### Database Errors
```sql
-- Check if columns exist
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'triggers' AND column_name = 'notify_contacts';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'trusted_contacts';
```

