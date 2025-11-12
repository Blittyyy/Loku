# Environment Variables Setup for Loku

## Step 1: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Sign in and open your Loku project
3. Go to **Settings** → **API**
4. Copy these two values:
   - **Project URL**: Found at the top (e.g., `https://abcdefgh.supabase.co`)
   - **anon public key**: Under "Project API keys" → "anon" key

## Step 2: Create .env File

Create a file named `.env` in the project root (same folder as `package.json`):

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Example:**
```env
EXPO_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzAxMjM0NTY3LCJleHAiOjE3MDM4MjY1Njd9.abcdef123456789
```

## Step 3: Restart Expo

After creating `.env`, restart your Expo development server:

```bash
# Stop current server (Ctrl+C)
npx expo start --clear
```

The `--clear` flag clears cache and reloads environment variables.

## Alternative: Add to app.json

If you prefer not to use `.env`, you can also add to `app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project-id.supabase.co",
      "supabaseAnonKey": "your-anon-key"
    }
  }
}
```

However, this is less flexible than `.env` files.

## Verification

To verify your credentials are loaded:

1. Add a console.log temporarily in `src/lib/supabase.ts`:
```typescript
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Missing');
```

2. Check terminal output when app starts
3. Should show your URL and "Set" for key

## Important Notes

- ✅ `.env` is already in `.gitignore` - won't be committed
- ✅ Never commit credentials to git
- ✅ Credentials are safe in `.env`
- ✅ Restart Expo after changing `.env`
- ⚠️ Make sure variables start with `EXPO_PUBLIC_` (required by Expo)

