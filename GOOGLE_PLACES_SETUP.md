# Google Places API Setup

## Step 1: Get API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing one)
3. Enable **Places API** (not Maps SDK, Places API specifically)
   - Navigate to "APIs & Services" → "Library"
   - Search for "Places API"
   - Click "Enable"
4. Go to "APIs & Services" → "Credentials"
5. Click "Create Credentials" → "API Key"
6. Copy your API key

## Step 2: Add to Environment Variables

Add this to your `.env` file (create it if it doesn't exist):

```env
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your-api-key-here
```

## Step 3: Restart Expo

```bash
npx expo start --clear
```

## Step 4: (Optional) Restrict API Key

For security, restrict your API key in Google Cloud Console:
1. Go to "Credentials"
2. Click on your API key
3. Under "API restrictions", select "Restrict key"
4. Choose "Places API" only
5. Save

## Cost

### New Accounts (First 90 Days)
- **Free**: $300 credit to spend over 90 days
- **Places Autocomplete**: ~$0.03 per request
- **Free tier covers**: ~10,000 requests
- **After 90 days**: You must manually upgrade to continue using the API

### Existing Accounts (Ongoing)
- **Free**: $200/month free credit (Google Cloud)
- **Places Autocomplete**: ~$0.03 per request
- **Free tier covers**: ~6,666 requests/month
- **No usage = $0/month**

### After Trial Period
- **Automatic charges?**: ❌ NO - You won't be charged automatically
- **To continue using**: You must manually upgrade to a pay-as-you-go account
- **If you don't upgrade**: The API will stop working (that's it, no charges)
- **Safe to use**: Yes, as long as you don't manually upgrade to paid, you won't be charged

## Usage

The autocomplete is now integrated in the "Add Place" screen:
- Start typing any address
- Select from suggestions
- Coordinates are automatically saved

## Testing

To test without a real API key:
1. The app will show an error
2. You can add a key later
3. The autocomplete won't work without a valid key

