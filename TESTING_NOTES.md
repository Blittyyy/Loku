# Testing Notes for Loku

## Current Status: Running in Expo Go

✅ **What Works:**
- Navigation between screens
- CRUD operations (Places, Triggers, Contacts)
- Settings UI and toggles
- Templates selection
- Recent Activity display
- Database reads/writes to Supabase

⚠️ **What Doesn't Work in Expo Go:**
- Background geofencing (needs build)
- Real location tracking (needs iOS/Android Info.plist)
- SMS notifications (needs Edge Function deployment)
- Custom sounds (needs actual audio files)

## Testing Options

### Option 1: Test UI Only (Current Setup)
- Navigate all screens
- Create/edit places and triggers
- Test templates
- Verify database persistence
- Settings and toggles

### Option 2: Full Testing (EAS Build)
Run:
```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios --profile development
```

This creates a standalone build with:
- Real geofencing
- Background location
- Custom sounds
- Edge Functions

## Next Steps

Choose one:
1. Continue testing UI/database features in Expo Go
2. Set up EAS Build for full functionality
3. I can help with any bugs you find

