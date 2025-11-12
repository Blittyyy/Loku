# Deploying the send-bulk Edge Function

This guide walks you through deploying the `send-bulk` Supabase Edge Function for Quick Actions.

## Prerequisites

1. **Install Supabase CLI**

   Supabase CLI cannot be installed via `npm install -g`. Use one of these methods:

   **Option A: Using Scoop (Recommended for Windows)**
   ```powershell
   # Install Scoop if you don't have it
   Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
   irm get.scoop.sh | iex

   # Install Supabase CLI
   scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
   scoop install supabase
   ```

   **Option B: Using Chocolatey**
   ```powershell
   choco install supabase
   ```

   **Option C: Download Binary Directly**
   1. Go to [Supabase CLI Releases](https://github.com/supabase/cli/releases)
   2. Download `supabase_windows_amd64.zip` (or appropriate version)
   3. Extract and add to your PATH

   **Option D: Use npx (No installation needed)**
   ```bash
   npx supabase functions deploy send-bulk
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project** (optional, if using local development)
   ```bash
   supabase link --project-ref your-project-ref
   ```

## Deployment Steps

### Option 1: Deploy via Supabase CLI (Recommended)

1. **Navigate to your project root**:
   ```powershell
   cd C:\Users\Bryan Blitman\Desktop\Loku
   ```

2. **Login to Supabase** (if not already logged in):
   ```bash
   supabase login
   ```

3. **Deploy the function**:
   ```bash
   supabase functions deploy send-bulk
   ```

   If you need to specify your project:
   ```bash
   supabase functions deploy send-bulk --project-ref your-project-ref
   ```

   **Or using npx (if CLI not installed)**:
   ```bash
   npx supabase functions deploy send-bulk
   ```

### Option 2: Deploy via Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **Edge Functions** in the sidebar
3. Click **Create a new function**
4. Name it `send-bulk`
5. Copy and paste the contents of `supabase/functions/send-bulk/index.ts`
6. Click **Deploy**

## Configure Environment Variables (Secrets)

After deploying, you need to set Twilio credentials as **secrets** in Supabase:

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click on **Secrets** (or look for a "Secrets" tab/section)
5. Click **Add a new secret** or **+ New Secret**
6. Add each secret one by one:
   - **Name:** `TWILIO_ACCOUNT_SID`
   - **Value:** Your Twilio Account SID (starts with `AC...`)
   - Click **Save**
   
   - **Name:** `TWILIO_AUTH_TOKEN`
   - **Value:** Your Twilio Auth Token
   - Click **Save**
   
   - **Name:** `TWILIO_PHONE_NUMBER`
   - **Value:** Your Twilio phone number (e.g., `+18556312911`)
   - Click **Save**

### Option 2: Via Supabase CLI

If you have the Supabase CLI installed and linked to your project:

```bash
# Set secrets
supabase secrets set TWILIO_ACCOUNT_SID=your_account_sid_here
supabase secrets set TWILIO_AUTH_TOKEN=your_auth_token_here
supabase secrets set TWILIO_PHONE_NUMBER=+18556312911
```

**Note:** These are stored as encrypted secrets and are only accessible to your Edge Functions at runtime.

### Verify Secrets Are Set

You can verify your secrets are set by checking the Edge Functions page in the dashboard, or by testing the function.

## Original Instructions

After deploying, you need to set Twilio credentials:

1. In Supabase Dashboard, go to **Edge Functions** → **send-bulk**
2. Click **Settings** or **Environment Variables**
3. Add these three variables:

   | Variable Name | Description | Example |
   |--------------|-------------|---------|
   | `TWILIO_ACCOUNT_SID` | Your Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
   | `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | `your_auth_token_here` |
   | `TWILIO_PHONE_NUMBER` | Your Twilio phone number | `+1234567890` |

### Getting Twilio Credentials

1. Sign up at [twilio.com](https://twilio.com) (free trial available)
2. Go to **Console** → **Account** → **API Keys & Tokens**
3. Copy your **Account SID** and **Auth Token**
4. Go to **Phone Numbers** → **Manage** → **Active Numbers**
5. Copy your phone number (format: `+1234567890`)

## Verify Deployment

1. In Supabase Dashboard → **Edge Functions** → **send-bulk**
2. Check the **Logs** tab to see if the function is running
3. Test the function (see Testing section below)

## Testing the Function

You can test the function using the Supabase Dashboard or via curl:

### Via Supabase Dashboard

1. Go to **Edge Functions** → **send-bulk**
2. Click **Invoke function**
3. Use this test payload:
   ```json
   {
     "group_id": "your-group-id-here",
     "message": "Test message",
     "preview_only": true
   }
   ```

### Via curl

```bash
curl -X POST https://your-project-ref.supabase.co/functions/v1/send-bulk \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "group_id": "your-group-id",
    "message": "Test message",
    "preview_only": true
  }'
```

## Troubleshooting

### Function not deploying
- Make sure Supabase CLI is installed: `supabase --version` (or use `npx supabase --version`)
- Check you're logged in: `supabase projects list` (or `npx supabase projects list`)
- Verify the function file exists: `dir supabase\functions\send-bulk\index.ts` (Windows) or `ls supabase/functions/send-bulk/index.ts` (Mac/Linux)
- If using npx, make sure you're in the project root directory

### Environment variables not working
- Variables are case-sensitive
- Make sure there are no extra spaces
- Redeploy after adding variables: `supabase functions deploy send-bulk`

### SMS not sending
- Verify Twilio credentials are correct
- Check phone number format: must include `+` and country code
- Check Twilio account balance (free trial has limits)
- Review function logs in Supabase Dashboard

### CORS errors
- The function already includes CORS headers
- Make sure you're using the correct endpoint URL
- Check that your request includes proper headers

## Function Endpoint

Once deployed, your function will be available at:
```
https://your-project-ref.supabase.co/functions/v1/send-bulk
```

The app automatically uses this endpoint when calling `supabase.functions.invoke('send-bulk', ...)`.

## Updating the Function

To update the function after making changes:

```bash
supabase functions deploy send-bulk
```

The function will be redeployed with your latest changes.

