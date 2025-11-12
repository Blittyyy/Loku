# Loku Geofencing Implementation

## Overview

Loku uses a **visit-based geofencing system with hysteresis** that ensures accurate arrival/departure detection. The system uses a state machine with inner/outer radius boundaries to prevent false triggers.

## Architecture

### Components

1. **State Machine** (`src/services/arrivalState.ts`)
   - Helper functions for timing checks
   - Accuracy validation
   - Distance calculations
   - Trigger execution

2. **Background Task** (`tasks/geofenceTask.ts`)
   - Runs in background with TaskManager
   - Handles Enter/Exit events
   - Manages state transitions
   - Schedules confirmation checks

3. **Registration Service** (`src/services/geofence.ts`)
   - Registers/unregisters geofences
   - Respects pause settings
   - Fetches places from Supabase

4. **React Hook** (`src/hooks/useGeofencing.ts`)
   - Auto-registers on app start
   - Re-registers when places change
   - Handles app resume events

## How It Works

### Hysteresis (Inner/Outer Radius)

Each place has:
- **Inner radius** (`radius`): Used for ENTER detection
- **Outer radius** (`outer_radius`): Used for EXIT confirmation

This creates a "dead zone" between inner and outer radius to prevent:
- False departure while just inside the location
- Duplicate arrival/departure events
- Triggers from GPS drift

### State Machine

```
outside → arriving → inside → leaving → outside
   ↑                                    ↓
   └────────────── (re-enter) ─────────┘
```

**States:**
- `outside`: User is beyond outer radius
- `arriving`: User entered inner radius, waiting for dwell confirmation
- `inside`: Confirmed inside, waiting for departure
- `leaving`: User exited inner radius but still in outer radius

### Timing Parameters

Each trigger has configurable timing:

- **`dwell_ms`** (default: 120000 = 2 min)
  - Time user must remain inside inner radius before arrival triggers
  - Prevents false triggers from GPS drift

- **`out_confirm_ms`** (default: 300000 = 5 min)
  - Time user must remain beyond outer radius before departure triggers
  - Allows for brief exits without triggering departure

- **`cooldown_ms`** (default: 600000 = 10 min)
  - Prevents duplicate alerts within cooldown period
  - Starts after last alert fired

### Accuracy Filtering

Only location updates with accuracy ≤50m are processed. Poor GPS fixes are ignored to prevent false triggers.

### Arrival Flow

1. User enters **inner radius** → `arriving` state
2. If user **stays inside** for `dwell_ms`:
   - Update database: `last_state = 'inside'`, `last_alert_at = now()`
   - Fire arrival notification
   - Log to `trigger_logs`
   - Transition to `inside` state
3. If user **leaves before** `dwell_ms`:
   - Revert to `outside` state
   - No alert fired

### Departure Flow

1. User exits **inner radius** while `inside`:
   - Check if still within **outer radius**
   - If YES → `leaving` state
   - If NO → `outside` state (confirm immediately)

2. While `leaving` (in "dead zone"):
   - If user **re-enters inner radius** → cancel departure, go to `inside`
   - If user **stays beyond outer radius** for `out_confirm_ms`:
     - Update database: `last_state = 'outside'`, `last_alert_at = now()`
     - Fire departure notification
     - Log to `trigger_logs`
     - Transition to `outside` state

## Acceptance Criteria Met ✅

✅ **ARRIVAL triggers exactly once per visit**
- Dwell period ensures only confirmed visits trigger

✅ **DEPARTURE triggers once after staying beyond outer_radius for `out_confirm_ms`**
- Outer radius hysteresis prevents false departures
- Confirmation period ensures user actually left

✅ **Neighborhood loops don't trigger departure**
- Dead zone between inner/outer radius absorbs brief exits
- Re-entry cancels departure sequence

✅ **Accuracy filtering**
- Only processes accurate GPS fixes (≤50m)

✅ **Cooldown protection**
- Prevents duplicate alerts within cooldown period

## Database Integration

### Trigger States in Database

Each trigger tracks:
- `last_state`: Current state machine state
- `last_event_at`: Timestamp of last state change
- `last_alert_at`: Timestamp of last notification sent

### Event Logging

All confirmed arrivals/departures are logged to `trigger_logs`:
- `place_name`: Name of the place
- `event_type`: 'arrival' or 'departure'
- `timestamp`: When event occurred

## Usage

The geofencing system is automatically active when:
- App has location permissions (foreground + background)
- Settings → "Pause Automations" is OFF
- Places exist in database

To pause: Toggle "Pause Automations" in Settings.

## Testing

### Test Scenarios

1. **Simple Arrival**
   - Enter inner radius
   - Wait 2 minutes
   - Should receive 1 arrival notification
   - Check `trigger_logs` table

2. **Departure**
   - Leave inner radius
   - Stay outside for 5 minutes
   - Should receive 1 departure notification

3. **Brief Exit (No Departure)**
   - Leave inner radius
   - Re-enter within 5 minutes
   - Should NOT receive departure notification

4. **Neighborhood Loop**
   - Walk in neighborhood (in outer radius, out of inner radius)
   - Should remain in "leaving" state
   - Should NOT trigger departure unless you leave for 5+ minutes

## Configuration

Default values in `supabase-schema.sql`:
```sql
dwell_ms INTEGER DEFAULT 120000      -- 2 minutes
out_confirm_ms INTEGER DEFAULT 300000 -- 5 minutes  
cooldown_ms INTEGER DEFAULT 600000   -- 10 minutes
outer_radius INTEGER DEFAULT 350     -- meters (default places use 200m inner, 350m outer)
```

These can be adjusted per-place or per-trigger as needed.

