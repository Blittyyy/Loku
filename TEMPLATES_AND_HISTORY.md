# Loku - Templates and History

## Templates Feature

### Overview
Provides **5 pre-made trigger templates** to help users quickly create common geofence triggers without typing everything from scratch.

### Available Templates

1. **Lock My Car** (Arrival)
   - Message: "Did you lock your car?"
   - Sound: ON
   - Perfect for parking lots

2. **Arrive Safely** (Arrival)
   - Message: "I've arrived safely at {{place_name}}."
   - Sound: ON
   - Let loved ones know you're safe

3. **Heading Home** (Departure)
   - Message: "Leaving now — see you soon."
   - Sound: ON
   - Quick departure message

4. **Grocery Reminder** (Arrival)
   - Message: "Open your shopping list."
   - Sound: OFF
   - Silent reminder for shopping

5. **Gym Motivation** (Arrival)
   - Message: "You did the hard part—showing up."
   - Sound: ON
   - Motivational gym reminder

### How to Use

1. **On Add Trigger screen**: Tap "📝 Use a Template" button
2. **Bottom sheet opens**: Shows all 5 templates
3. **Tap a template**: Pre-fills all fields
4. **Edit if needed**: User can modify message, type, or sound settings
5. **Save**: Creates trigger as usual

### Technical Implementation

**Component**: `src/components/TemplateSheet.tsx`
- Modal bottom sheet UI
- Scrollable list of templates
- Each template shows:
  - Name
  - Type badge (arrival/departure)
  - Message preview
  - Sound status
- Picking a template calls `onSelect` callback

**Integration**: Added to `app/trigger/new.tsx`
- "Use a Template" button at top of form
- Template selection pre-fills form state
- User can edit before saving

## Recent Activity Feature

### Overview
Shows **last 10 geofence events** from `trigger_logs` table, giving users visibility into their location-based activity history.

### Where It Appears

1. **Settings Screen**
   - Shows all recent activity across all places
   - Great for overview

2. **Place Details Screen**
   - Shows activity specific to that place
   - Filtered by place_id

### What's Displayed

For each activity entry:
- **Icon**: 🏠 for arrival, 👋 for departure
- **Place name**: Where the event occurred
- **Event type**: ARRIVAL or DEPARTURE
- **Timestamp**: Relative time (e.g., "2h ago", "1d ago")

### Technical Implementation

**Component**: `src/components/RecentActivity.tsx`
- Fetches from `trigger_logs` table
- Supports filtering by place
- Relative timestamp formatting
- Empty state for no activity
- Loading state while fetching

**Data Flow**:
```
Database (trigger_logs) 
  ↓
Query with limit (default: 10)
  ↓
Filter by place (if specified)
  ↓
Format timestamps
  ↓
Render list
```

### Schema Used

```sql
trigger_logs (
  id uuid,
  place_name text,
  event_type text,
  timestamp timestamptz
)
```

Events are logged automatically when:
- Arrival is confirmed (after dwell_ms)
- Departure is confirmed (after out_confirm_ms)

## Home Subheader

### Display
The home screen now shows:
```
Loku
{activeCount} active trigger{activeCount !== 1 ? 's' : ''}
```

Example outputs:
- "0 active triggers"
- "1 active trigger"
- "5 active triggers"

### Technical Details

**Implementation**:
```typescript
const activeCount = useTriggers((state) => state.activeCount);
```

**Computed in Store**: `src/store/useTriggers.ts`
- `activeCount` is computed whenever triggers change
- Only counts triggers where `enabled = true`
- Updates automatically when triggers are added/removed/enabled/disabled

## User Flow Examples

### Using Templates

**Scenario**: User wants a "lock car" reminder at work parking lot

1. Open app → Select "Work" place
2. Tap "Add Trigger"
3. Tap "📝 Use a Template"
4. Select "Lock My Car"
5. Form auto-fills:
   - Type: Arrival
   - Message: "Did you lock your car?"
   - Sound: ON
6. User can edit or save as-is
7. Tap "Save"
8. Done!

### Viewing Activity

**Scenario**: User wants to see recent arrivals/departures

1. Open Settings
2. Scroll to "Recent Activity" section
3. See last 10 events:
   - 🏠 Home - ARRIVAL - 2h ago
   - 👋 Office - DEPARTURE - 4h ago
   - 🏠 Home - ARRIVAL - 1d ago
4. Can also filter per-place in Place Details

## Benefits

### Templates
- ✅ Fast trigger creation
- ✅ No typing needed
- ✅ Pre-tested messages that work well
- ✅ Can still customize before saving
- ✅ Great for new users

### Recent Activity
- ✅ Visibility into geofence events
- ✅ Debug trigger issues
- ✅ Track location history
- ✅ Verify triggers are working
- ✅ Great for understanding usage

## Future Enhancements

### Templates
- [ ] User-created custom templates
- [ ] Template categories
- [ ] More templates (10+ options)
- [ ] Template sharing

### Recent Activity
- [ ] Detailed view per event
- [ ] Export activity log
- [ ] Filter by date range
- [ ] Search activity
- [ ] Analytics dashboard

