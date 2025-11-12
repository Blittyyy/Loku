# Loku

A minimal, production-ready Expo (React Native + TypeScript) app for location-based automations and geofencing on iOS and Android.

## Features

- **Geofencing**: Trigger automated actions when arriving or departing from specific locations
- **Place Management**: Add and manage locations with custom geofence radius
- **Customizable Triggers**: Set arrival and departure notifications with custom messages
- **Sound Controls**: Enable/disable notification sounds per trigger
- **Settings**: Pause automations, respect silent mode, and test notifications

## Tech Stack

- **Framework**: Expo with React Native and TypeScript
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Navigation**: React Navigation (Native Stack)
- **Location & Geofencing**: expo-location + expo-task-manager
- **Notifications**: expo-notifications
- **Audio**: expo-av
- **Database**: Supabase
- **Haptics**: expo-haptics
- **Local Storage**: AsyncStorage

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator (for iOS) or Android Emulator/device (for Android)
- Supabase account (for data persistence)

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up Supabase:

- Create a new Supabase project at [supabase.com](https://supabase.com)
- Copy your project URL and anon key from Project Settings → API
- Create environment variables or add to app config (see below)

3. Configure Supabase environment variables:

Create a `.env` file in the project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Alternatively, you can add these to `app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your_supabase_project_url",
      "supabaseAnonKey": "your_supabase_anon_key"
    }
  }
}
```

4. Set up the database:

- Open your Supabase project dashboard
- Go to SQL Editor
- Paste the contents of `supabase-schema.sql` and run it

This will create the necessary tables (`users`, `places`, `triggers`, `trigger_logs`) with Row Level Security enabled.

### Running the App

Start the development server:

```bash
npx expo start
```

Then:
- Press `i` to open iOS simulator
- Press `a` to open Android emulator
- Scan QR code with Expo Go app on your device

### Project Structure

```
├── app/                    # Screen routes
│   ├── (tabs)/
│   │   └── index.tsx       # Home screen
│   ├── place/[id].tsx      # Place details screen
│   ├── trigger/
│   │   ├── new.tsx         # Add trigger screen
│   │   └── [id].tsx        # Edit trigger screen
│   └── settings/
│       └── index.tsx       # Settings screen
├── src/
│   ├── components/         # Reusable UI components
│   ├── store/             # Zustand state stores
│   ├── services/          # Service layer (location, notifications, etc.)
│   ├── lib/               # Utility files (Supabase config)
│   └── types/             # TypeScript types
├── tasks/
│   └── geofenceTask.ts    # Background geofencing task
└── App.tsx                # Main app entry with navigation

```

## Current Implementation

### Screens

1. **Home**: Lists all places with active trigger count, settings button, and pause banner
2. **Place Details**: Shows arrival and departure triggers for a specific place
3. **Add/Edit Trigger**: Modal-style screens to create or edit triggers
4. **Settings**: App-wide settings, toggles for pause automations and silent mode, test notification button

### Permissions & Configuration

The app is configured with proper permissions for iOS and Android:

**iOS:**
- Location permissions with "when in use" and "always" descriptions
- Background location capability
- Temporary full accuracy authorization

**Android:**
- Fine location access
- Background location access
- Notification posting permissions
- Foreground service type for location

### State Management

- `usePlaces`: Manages places (CRUD operations)
- `useTriggers`: Manages triggers linked to places
- `useSettings`: App settings (pause automations, silent mode)
- `useAuth`: User authentication (to be wired with Supabase)

### Services

- `location.ts`: Full location permission handling (`ensurePermissions`), current position tracking, and geofence registration/removal
- `geofence.ts`: Geofencing task management (start/stop)
- `notifications.ts`: Notification initialization (`initNotifications`), local notification sending (`sendLocal`), permission handling
- `sounds.ts`: Audio playback (to be implemented)
- `arrivalState.ts`: Trigger execution logic

### Key Features

- **Permission Management**: Automatic permission requests on app launch for location and notifications
- **Geofencing Ready**: Infrastructure in place for background geofence monitoring
- **Settings Integration**: Pause automations toggle shows banner on home screen, test notification functionality
- **iOS & Android Support**: Proper native permission configurations for both platforms

## Mock Data

The app comes with sample data for demonstration:
- 2 sample places (Home and Office)
- 2 sample triggers (arrival and departure for Home)

## Configuration

### Supabase

The app uses Supabase for data persistence. See "Installation" section above for setup instructions.

**Database Tables:**
- `places` - Stores location data
- `triggers` - Stores arrival/departure triggers
- `trigger_logs` - Logs geofence events
- `users` - User information (future use)

**Row Level Security:** Currently configured with permissive policies for development. Update policies for production deployment.

Schema file: `supabase-schema.sql`

### Permissions

The app requires:
- Location permissions (foreground and background)
- Notification permissions

## Design System

- **Primary Color**: #3B82F6 (Blue)
- **Background**: #F9FAFB (Light gray)
- **Cards**: White with rounded corners and subtle shadows
- **Text Colors**: Various shades of gray (#1F2937, #6B7280, #9CA3AF)

## Development

### Adding New Features

1. Create new screens in `app/` directory
2. Add routes to `App.tsx` navigation stack
3. Create/update state stores as needed
4. Build reusable components in `src/components/`

### Background Tasks

Geofencing runs as a background task defined in `tasks/geofenceTask.ts`. This task is automatically registered on app startup.

## Next Steps

- [ ] Configure Supabase for data persistence
- [ ] Implement actual geofence monitoring
- [ ] Add sound file playback
- [ ] Implement place creation with map picker
- [ ] Add authentication flow
- [ ] Wire up notifications with actual triggers
- [ ] Add analytics and error tracking

## License

MIT

