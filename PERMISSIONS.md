# Loku - Permissions & Configuration

This document outlines the permissions and configuration implemented in the Loku app.

## iOS Configuration

### InfoPlist Entries (in app.json)

- **NSLocationWhenInUseUsageDescription**: "Loku uses your location to trigger arrival reminders."
- **NSLocationAlwaysAndWhenInUseUsageDescription**: "Loku runs geofencing in the background."
- **NSLocationTemporaryUsageDescriptionDictionary**: 
  - Entry "FullAccuracy" = "Needed for accurate arrival detection."

### Background Modes

- `UIBackgroundModes`: `["location"]` - Enables location tracking in background

## Android Configuration

### Permissions (in app.json)

- `ACCESS_FINE_LOCATION` - Required for precise location tracking
- `ACCESS_BACKGROUND_LOCATION` - Required for background geofencing
- `POST_NOTIFICATIONS` - Required for API 33+ to show notifications

### Foreground Service

- `foregroundService.enabled: true` - Enables location tracking as foreground service

## Service Functions

### Location Services (`src/services/location.ts`)

#### `ensurePermissions()`
Requests and ensures all required location permissions:
- Foreground location permission
- Background location permission
- Temporary full accuracy (iOS, configured via InfoPlist)

Returns: `{ foreground: PermissionStatus, background: PermissionStatus, canUseGeofencing: boolean }`

#### `getCurrentPosition()`
Gets the current device position with balanced accuracy.

#### `registerGeofences(places)`
Registers geofences for provided places. Calls `ensurePermissions()` first.

#### `unregisterGeofences()`
Stops all geofencing.

### Notification Services (`src/services/notifications.ts`)

#### `initNotifications()`
Initializes notifications on app startup:
- Requests notification permissions
- Sets up notification channel for Android
- Returns true if permission granted

#### `sendLocal(title, body)`
Sends a local notification immediately with the provided title and body.

#### `sendTestNotification()`
Wrapper that calls `sendLocal('Loku', 'Test notification')` for the Settings screen.

## App Initialization

On app launch (in `App.tsx`):

1. **Notifications**: Calls `initNotifications()` to request notification permissions
2. **Location**: Calls `ensurePermissions()` asynchronously to request location permissions

Permissions are requested on first launch, with user prompts appearing naturally.

## Settings Integration

- **Pause Automations Toggle**: When enabled, a yellow banner appears on the Home screen showing "⚠️ Automations paused"
- **Send Test Notification Button**: Uses `sendLocal('Loku', 'Test notification')` to test notification functionality

## Usage

### To Test Notifications

1. Open the app
2. Grant notification permission when prompted
3. Go to Settings
4. Tap "Send Test Notification"
5. You should see a notification titled "Loku" with body "Test notification"

### To Test Location Permissions

1. Open the app
2. Grant location permissions when prompted (both foreground and background)
3. Check the console for permission status logs
4. The app will only work with geofencing when all permissions are granted

### To Test Settings Toggle

1. Go to Settings
2. Toggle "Pause Automations" to ON
3. Go back to Home screen
4. You should see a yellow banner at the top: "⚠️ Automations paused"
5. Toggle OFF to hide the banner

## Testing

Run the app:

```bash
npx expo start
```

- Press `i` for iOS simulator
- Press `a` for Android emulator
- Or scan QR code with Expo Go app

## Next Steps

- Implement actual geofence monitoring trigger logic
- Add place creation with map picker (with permission check)
- Wire up notification sound playback based on settings
- Connect to Supabase for data persistence
- Add error handling for permission denial scenarios

