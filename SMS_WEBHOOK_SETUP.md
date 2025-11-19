# SMS Webhook Setup for Opt-Out (STOP keyword)

This guide explains how to set up the SMS webhook to handle STOP/START keywords for opt-out/opt-in compliance.

## Overview

The `sms-webhook` Edge Function handles incoming SMS replies from contacts:
- **STOP keywords**: Unsubscribes contacts (sets `confirmed: false`)
- **START keywords**: Re-subscribes contacts (sets `confirmed: true`)
- **Unknown messages**: Sends help text

## Deployment

### 1. Deploy the Edge Function

```bash
# Via Supabase CLI
supabase functions deploy sms-webhook

# Or via Supabase Dashboard
# Go to Edge Functions → Create Function → Name: sms-webhook
# Paste contents of supabase/functions/sms-webhook/index.ts
```

### 2. Get Your Webhook URL

After deployment, your webhook URL will be:
```
https://your-project-ref.supabase.co/functions/v1/sms-webhook
```

### 3. Configure Twilio Webhook

1. Go to [Twilio Console](https://console.twilio.com)
2. Navigate to **Phone Numbers** → **Manage** → **Active Numbers**
3. Click on your phone number
4. Scroll to **Messaging Configuration**
5. Under **A MESSAGE COMES IN**, set:
   - **Webhook URL**: `https://your-project-ref.supabase.co/functions/v1/sms-webhook`
   - **HTTP Method**: `POST`
6. Click **Save**

## How It Works

### Opt-Out (STOP)

When someone replies with:
- `STOP`
- `STOPALL`
- `UNSUBSCRIBE`
- `CANCEL`
- `END`
- `QUIT`

The function:
1. Finds the contact by phone number
2. Sets `confirmed: false` in database
3. Sends confirmation: "You have been unsubscribed..."

### Opt-In (START)

When someone replies with:
- `START`
- `YES`
- `UNSTOP`
- `SUBSCRIBE`

The function:
1. Finds the contact by phone number
2. Sets `confirmed: true` in database
3. Sends confirmation: "You have been subscribed..."

### Unknown Messages

For any other message, sends:
"Loku: Reply STOP to unsubscribe from notifications, or START to subscribe."

## Testing

### Test Opt-Out

1. Send a message to your Twilio number from a confirmed contact's phone
2. Reply with: `STOP`
3. Check database: Contact should have `confirmed: false`
4. Try sending a Quick Action - should not send to that contact

### Test Opt-In

1. From an unconfirmed contact's phone
2. Reply with: `START`
3. Check database: Contact should have `confirmed: true`
4. Try sending a Quick Action - should now send

## Phone Number Matching

The function matches phone numbers by:
- Exact match (normalized, digits only)
- Last 10 digits match (handles different country code formats)
- Handles various phone formats (+1, 1-, etc.)

## Security

- Uses Supabase Service Role Key (server-side only)
- Validates phone numbers before updating
- Only updates `confirmed` status (no other data changes)
- Logs all opt-in/opt-out events

## Troubleshooting

### Webhook Not Receiving Messages

1. Check Twilio webhook URL is correct
2. Verify Edge Function is deployed
3. Check Supabase function logs for errors
4. Test webhook URL manually (should return TwiML)

### Phone Number Not Matching

1. Check phone number format in database
2. Verify phone numbers are stored with country code (+1)
3. Check function logs for matching attempts

### Contact Not Unsubscribing

1. Verify contact exists in database
2. Check phone number matches exactly
3. Review function logs for errors
4. Ensure `confirmed` field can be updated (RLS policies)

## Compliance Notes

- ✅ Opt-out keywords handled automatically
- ✅ Opt-in keywords supported
- ✅ Clear messaging in all SMS
- ✅ Opt-out instructions in every message
- ✅ Immediate unsubscription (no delay)

