# Supabase Setup Guide for Loku

## Quick Start

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose an organization and set:
   - Project name: `loku`
   - Database password: (save this securely)
   - Region: Choose closest to your users
5. Wait for project to be created (~2 minutes)

### 2. Get API Credentials

1. In your project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon/public key**: Long key under "Project API keys"

### 3. Set Environment Variables

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

⚠️ **Important**: Never commit the `.env` file. It's already in `.gitignore`.

### 4. Create Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** or press Ctrl+Enter
5. You should see "Success. No rows returned"

This creates:
- `places` table (location data)
- `triggers` table (arrival/departure settings)
- `trigger_logs` table (event history)
- `users` table (user information)
- Row Level Security policies (open for dev)

### 5. Verify Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see 4 tables: `places`, `triggers`, `trigger_logs`, `users`

### 6. Run the App

```bash
npx expo start
```

The app will now connect to Supabase and fetch data from the database!

## Environment Variables Format

Your `.env` file should look like:

```env
EXPO_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Database Schema

The schema includes:

### Places
- Basic location info (name, address, lat, lng, radius)
- Links to users (for future multi-user support)
- Includes `outer_radius` for advanced geofencing

### Triggers
- Tied to places via `place_id` foreign key
- Type: 'arrival' or 'departure'
- Configurable: message, sound_enabled, enabled
- Advanced: dwell time, confirm time, cooldown period

### Trigger Logs
- Event history for debugging
- Tracks arrival/departure events with timestamps

### Row Level Security

Currently uses permissive policies for development:
```sql
create policy "dev places" on places for all using (true) with check (true);
```

**For production**: Update these policies to restrict access by user_id.

## Testing

1. Start the app: `npx expo start`
2. The app will fetch places and triggers from Supabase
3. Add a new place through the UI (will be saved to Supabase)
4. Check Supabase Table Editor to see your data

## Troubleshooting

### "Failed to fetch places"
- Check `.env` file has correct credentials
- Verify Supabase project is active
- Check internet connection

### "Permission denied"
- Verify RLS policies were created
- Check if tables exist in Table Editor

### Data not showing
- Clear app cache: `npx expo start --clear`
- Check browser console for errors
- Verify data exists in Supabase tables

## Production Deployment

Before deploying:

1. **Update RLS policies** to restrict by user_id:
   ```sql
   drop policy "dev places" on places;
   create policy "user places" on places 
     using (auth.uid() = user_id) 
     with check (auth.uid() = user_id);
   ```

2. **Add user authentication** (implement auth flow)

3. **Enable backups** in Supabase settings

4. **Monitor usage** in Supabase dashboard

## Next Steps

- [ ] Implement user authentication
- [ ] Update RLS policies for production
- [ ] Add API rate limiting
- [ ] Set up database backups
- [ ] Implement real-time subscriptions for live updates

