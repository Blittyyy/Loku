# Google Places API Setup - CRITICAL

## Which API to Enable

✅ **Enable:** Places API (classic)
❌ **Don't enable:** Places API (New)

## Why?

The `react-native-google-places-autocomplete` library uses the classic Places API endpoints. The "Places API (New)" uses different endpoints and won't work with the current library.

## Steps to Fix

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **Library**
3. Search for "Places API" (NOT the "New" one)
4. Click **Enable**
5. Wait 2-3 minutes for activation
6. Restart Expo: `npx expo start --clear`

## Verify You Have the Right One

After enabling, check your "Enabled APIs" list. You should see:
- ✅ **Places API** (the classic one)
- ❌ Places API (New) - disable this if you enabled it

## Cost

- Places API (classic): ~$0.03 per autocomplete request
- Free tier: First $200/month covers ~6,666 requests
- Your $300 credit covers ~10,000 requests over 90 days

