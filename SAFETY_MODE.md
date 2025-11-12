# Loku - Safety Mode Documentation

## Overview

Safety Mode allows users to share their location updates with **trusted contacts**, providing peace of mind for parents, partners, and loved ones. When enabled, contacts receive SMS notifications when the user arrives or departs from places.

## Features

### 1. Trusted Contacts Management

**Where**: Settings → Safety Mode enabled → Trusted Contacts section

**Actions**:
- Add contacts with name, phone, and/or email
- Toggle per-contact sharing (arrival/departure)
- Delete contacts

**Fields**:
- Name (required)
- Phone (optional, for SMS)
- Email (optional, for future email alerts)
- Share Arrival (toggle)
- Share Departure (toggle)

### 2. Safety Mode Settings

**Toggles**:
1. **Safety Mode**: Master switch for contact sharing
2. **Notify Contacts**: When enabled, sends alerts to contacts (auto-enabled with Safety Mode)

### 3. Per-Trigger Configuration

Each trigger can enable contact notifications:
- Default: OFF
- Users check "Notify Contacts" when creating/editing triggers
- Only triggers with `notify_contacts=true` will send remote alerts

## How It Works

### Trigger Flow

```
Confirmed Arrival/Departure
  ↓
Check: Settings.safetyMode? → Skip if disabled
  ↓
Check: Settings.notifyContacts? → Skip if disabled
  ↓
Check: Trigger.notify_contacts? → Skip if false
  ↓
Query trusted_contacts (confirmed=true, relevant share flag)
  ↓
For each contact:
  POST to Supabase Edge Function
  ↓
Edge Function sends SMS (Twilio)
  ↓
Log result to trigger_logs
```

### Edge Function: send-shared-alert

**Location**: `supabase/functions/send-shared-alert/`

**Request**:
```json
{
  "contact_phone": "+1234567890",
  "contact_email": "contact@example.com",
  "place_name": "Home",
  "event_type": "arrival"
}
```

**Response**:
```json
{
  "ok": true,
  "results": [
    { "type": "sms", "success": true, "message": "SMS sent successfully" }
  ]
}
```

### SMS Messages

**Arrival**:
```
📍 {place_name}: I've arrived safely.
```

**Departure**:
```
👋 {place_name}: I've left.
```

### Database Schema

```sql
-- trusted_contacts table
CREATE TABLE trusted_contacts (
  id uuid PRIMARY KEY,
  user_id uuid,
  name text NOT NULL,
  phone text,
  email text,
  confirmed boolean DEFAULT false,
  share_arrival boolean DEFAULT true,
  share_departure boolean DEFAULT true,
  created_at timestamptz
);

-- triggers table (column added)
ALTER TABLE triggers ADD COLUMN notify_contacts boolean DEFAULT false;
```

## User Experience

### Parent/Child Use Case

**Parent's Phone (Receiving Alerts)**:
1. Receive SMS when child arrives at school: "📍 School: I've arrived safely."
2. Receive SMS when child leaves school: "👋 School: I've left."
3. Only ONE alert per confirmed event
4. No false alerts from GPS drift or short exits

**Child's Phone (Loku App)**:
1. Enable Safety Mode in Settings
2. Add parent as trusted contact
3. Create triggers with "Notify Contacts" enabled
4. When arriving/leaving, contact automatically notified

### Neighbor Loop Protection

Safety alerts respect the same hysteresis and cooldown as local notifications:
- ✅ Arrival: Only after dwelling inside for `dwell_ms`
- ✅ Departure: Only after staying outside for `out_confirm_ms`
- ✅ No alerts for brief exits (neighborhood loops)
- ✅ Cooldown prevents duplicate alerts

### "Arrived Safely" Template

When using the "Arrive Safely" template:
- Local notification: Still shows (e.g., "Lock your car")
- Remote notification: Sent to contacts
- Both respect the same confirmation periods
- No duplicate local notifications for safety checks

## Setup Guide

### 1. Database Migration

Run in Supabase SQL Editor:

```sql
-- See supabase-migration.sql for full migration
ALTER TABLE triggers ADD COLUMN IF NOT EXISTS notify_contacts boolean DEFAULT false;
CREATE TABLE IF NOT EXISTS trusted_contacts (...);
```

### 2. Deploy Edge Function

```bash
cd supabase/functions/send-shared-alert
supabase functions deploy send-shared-alert
```

### 3. Set Environment Variables

In Supabase Dashboard → Edge Functions → Environment Variables:

- `TWILIO_SID`: Your Twilio Account SID
- `TWILIO_TOKEN`: Your Twilio Auth Token
- `TWILIO_FROM`: Your Twilio phone number

### 4. Configure Contacts

In app:
1. Settings → Enable "Safety Mode"
2. "Notify Contacts" auto-enables
3. Add trusted contacts with phone numbers
4. Configure per-contact sharing preferences

### 5. Enable on Triggers

When creating/editing triggers:
- Check "Notify Contacts" checkbox
- This trigger will send alerts to contacts on confirmed arrival/departure

## Security & Privacy

### Data Storage
- Phone numbers stored in `trusted_contacts` table
- RLS enabled with permissive dev policy
- Update policies for production deployment

### SMS Delivery
- Sends via Twilio API
- Only sends on confirmed events (dwell/confirmation periods)
- Respects cooldown to prevent spam
- No tracking or analytics on messages

### Permission Model
- User adds contacts (no auto-confirm)
- Contacts must be manually added
- User controls what to share (arrival/departure toggles)
- Can disable per-trigger or globally

## Troubleshooting

### SMS Not Sending
1. Check Twilio credentials in Supabase env vars
2. Verify phone number format: +1234567890
3. Check Supabase function logs
4. Ensure Safety Mode + Notify Contacts both enabled
5. Verify trigger has `notify_contacts=true`

### Duplicate Alerts
- Cooldown should prevent this (10min default)
- Check if multiple triggers set up for same place
- Review `last_alert_at` timestamps in database

### No Contacts Receiving
- Check contact's `share_arrival`/`share_departure` flags
- Verify `confirmed=true`
- Ensure contact has phone number
- Check function invocation logs in Supabase

## Future Enhancements

- [ ] Email notifications in addition to SMS
- [ ] Push notifications to Loku app users
- [ ] Two-way location sharing
- [ ] Emergency alerts with location coordinates
- [ ] Group contacts (family circle)
- [ ] Scheduled safety check-ins
- [ ] Photo verification on arrival
- [ ] Custom alert messages per contact

## Acceptance Criteria ✅

✅ **Parent receives ONE alert when child arrives**
- Only after dwell_ms (2min by default)
- Sends once per visit

✅ **Parent receives ONE alert when child departs**
- Only after leaving outer radius for out_confirm_ms (5min)
- Sends once per departure

✅ **No alerts on neighborhood loops**
- Hysteresis prevents false departures
- Re-entry cancels departure alert
- Dead zone absorbs brief exits

✅ **Respects cooldown and settings**
- Same 10min cooldown as local notifications
- Only sends if Safety Mode + Notify Contacts both enabled
- Only sends if trigger.notify_contacts=true

