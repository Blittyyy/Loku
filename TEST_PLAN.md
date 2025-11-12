# Loku - Test Plan & QA Checklist

## Prerequisites

- [ ] Expo app running (`npx expo start`)
- [ ] Test device connected (iOS/Android simulator or physical device)
- [ ] Supabase database configured and migrated
- [ ] Location permissions granted
- [ ] Notification permissions granted
- [ ] Twilio configured (for Safety Mode tests)

---

## 1. Permissions Testing

### Foreground Location
- [ ] **Test**: Deny foreground location permission
  - **Expected**: App shows guidance/request to enable in Settings
  - **Result**: _______________
  
- [ ] **Test**: Allow foreground location permission
  - **Expected**: App can access location, geofencing works
  - **Result**: _______________

### Background Location
- [ ] **Test**: Deny background location permission
  - **Expected**: App prompts with appropriate message
  - **Result**: _______________
  
- [ ] **Test**: Allow background location permission
  - **Expected**: Geofencing works in background
  - **Result**: _______________

### Notifications
- [ ] **Test**: Request notification permission
  - **Expected**: System prompt appears
  - **Result**: _______________
  
- [ ] **Test**: Allow notifications, tap "Send Test Notification" in Settings
  - **Expected**: Notification appears with "Loku - Test notification" + haptic feedback
  - **Result**: _______________

---

## 2. Arrival Triggers - Single Firing

### Basic Arrival Test
- [ ] **Setup**: Create "Test Home" place with:
  - Coordinates: 37.7749, -122.4194
  - Radius: 200m
  - Outer radius: 350m
  
- [ ] **Setup**: Create arrival trigger:
  - Message: "Arrived at test location"
  - Sound: ON
  - **Notify Contacts**: OFF (test this first)
  
- [ ] **Test**: Physically enter geofence (or simulate with device)
  - **Expected**: After 2 minutes (dwell_ms):
    - One notification appears
    - Sound plays (if enabled)
    - Haptic feedback
    - No duplicate alerts
  
- [ ] **Result**: _______________

### Cooldown Protection
- [ ] **Test**: Leave and re-enter within 10 minutes
  - **Expected**: No second alert fired (cooldown active)
  
- [ ] **Result**: _______________
  
- [ ] **Test**: Wait >10 minutes, re-enter
  - **Expected**: Second alert fires (cooldown expired)
  
- [ ] **Result**: _______________

---

## 3. Departure Triggers - Hysteresis

### Basic Departure Test
- [ ] **Setup**: Create departure trigger:
  - Message: "Left test location"
  - Sound: ON
  
- [ ] **Test**: Exit inner radius (200m) but stay within outer (350m)
  - **Expected**: NO departure alert yet (still in dead zone)
  
- [ ] **Result**: _______________
  
- [ ] **Test**: Stay beyond outer radius for 5 minutes (out_confirm_ms)
  - **Expected**: ONE departure alert fired
  
- [ ] **Result**: _______________

### Re-entry Cancellation
- [ ] **Test**: Exit inner radius, start departure countdown
  - **Expected**: In "leaving" state
  
- [ ] **Test**: Re-enter inner radius before 5 minutes
  - **Expected**: Departure cancelled, no alert sent
  
- [ ] **Result**: _______________

---

## 4. Neighborhood Loop Protection

### Brief Exit Test
- [ ] **Setup**: Inside geofence with active departure trigger
  
- [ ] **Test**: Walk out of inner radius (but stay in outer)
  - **Expected**: No departure alert
  
- [ ] **Result**: _______________
  
- [ ] **Test**: Come back inside inner radius
  - **Expected**: Cancelled departure, no alert logged
  
- [ ] **Result**: _______________

### Loop Simulation
- [ ] **Test**: Walk around neighborhood (outer radius but outside inner)
  - **Expected**: No alerts triggered
  - Stay in "leaving" state but no confirmation
  
- [ ] **Result**: _______________

---

## 5. Pause Automations Toggle

### Pause Test
- [ ] **Setup**: Active triggers configured
  
- [ ] **Test**: Settings → Enable "Pause Automations"
  - **Expected**: Yellow banner appears on Home: "⚠️ Automations paused"
  
- [ ] **Result**: _______________
  
- [ ] **Test**: Enter/leave geofence while paused
  - **Expected**: NO alerts fire (local or remote)
  
- [ ] **Result**: _______________

### Resume Test
- [ ] **Test**: Settings → Disable "Pause Automations"
  - **Expected**: Banner disappears
  
- [ ] **Result**: _______________
  
- [ ] **Test**: Enter geofence after resume
  - **Expected**: Alerts resume firing normally
  
- [ ] **Result**: _______________

---

## 6. Templates Feature

### Template Selection
- [ ] **Test**: Add Trigger → Tap "📝 Use a Template"
  - **Expected**: Bottom sheet opens with 5 templates
  
- [ ] **Result**: _______________

### Lock My Car Template
- [ ] **Test**: Select "Lock My Car" template
  - **Expected**: Pre-fills: Arrival, "Did you lock your car?", Sound ON
  - **Expected**: Can edit before saving
  
- [ ] **Result**: _______________

### Arrive Safely Template
- [ ] **Test**: Select "Arrive Safely" template
  - **Expected**: Pre-fills: Arrival, "I've arrived safely at {{place_name}}.", Sound ON
  
- [ ] **Result**: _______________

### Grocery Reminder Template
- [ ] **Test**: Select "Grocery Reminder" template
  - **Expected**: Pre-fills: Arrival, "Open your shopping list.", Sound OFF
  
- [ ] **Result**: _______________

### Gym Motivation Template
- [ ] **Test**: Select "Gym Motivation" template
  - **Expected**: Pre-fills: Arrival, "You did the hard part—showing up.", Sound ON
  
- [ ] **Result**: _______________

### Save & Fire Template Triggers
- [ ] **Test**: Save trigger with template, simulate arrival
  - **Expected**: Notification fires with template message
  
- [ ] **Result**: _______________

---

## 7. Safety Mode - Remote Notifications

### Setup Trusted Contacts
- [ ] **Test**: Settings → Safety Mode → Enable
  - **Expected**: "Notify Contacts" auto-enables
  - Trusted Contacts section appears
  
- [ ] **Result**: _______________

- [ ] **Test**: Add trusted contact:
  - Name: "Test Parent"
  - Phone: "+1234567890" (your real phone)
  - Share Arrival: ON
  - Share Departure: ON
  
- [ ] **Result**: _______________

### Safety Mode Arrival Test
- [ ] **Setup**: Create arrival trigger with "Notify Contacts" checked
  
- [ ] **Test**: Enter geofence and wait for dwell (2 min)
  - **Expected**: 
    - Local notification fires
    - SMS sent to contact: "📍 {place_name}: I've arrived safely."
    - Only ONE SMS sent
  
- [ ] **Result**: _______________

### Safety Mode Departure Test
- [ ] **Setup**: Create departure trigger with "Notify Contacts" checked
  
- [ ] **Test**: Leave geofence and stay outside for out_confirm_ms (5 min)
  - **Expected**:
    - Local notification fires
    - SMS sent to contact: "👋 {place_name}: I've left."
    - Only ONE SMS sent
  
- [ ] **Result**: _______________

### Safety Mode Cooldown
- [ ] **Test**: Re-enter within cooldown after Safety alert sent
  - **Expected**: No duplicate SMS (cooldown active)
  
- [ ] **Result**: _______________

### Per-Trigger Notify Toggle
- [ ] **Test**: Create 2 triggers, one with Notify ON, one with OFF
  - **Expected**: Only trigger with ON sends SMS
  
- [ ] **Result**: _______________

### Respect Silent Mode
- [ ] **Test**: Settings → "Respect Silent Mode" ON
  - **Expected**: Sounds don't play when device in silent mode
  - SMS still sends (SMS independent of local sound)
  
- [ ] **Result**: _______________

---

## 8. Activity Logs

### Verify Logging
- [ ] **Test**: Check `trigger_logs` table after arrival event
  - **Expected**: Entry with:
    - place_name: actual place name
    - event_type: "arrival"
    - timestamp: current time
  
- [ ] **Result**: _______________

- [ ] **Test**: Check `trigger_logs` after Safety alert
  - **Expected**: Entry with:
    - place_name: "{place_name} (to {contact_phone})"
    - event_type: "safety_arrival"
  
- [ ] **Result**: _______________

### Activity Display
- [ ] **Test**: Settings → Recent Activity section
  - **Expected**: Shows last 10 events with timestamps
  
- [ ] **Result**: _______________

- [ ] **Test**: Place Details → Activity for that place
  - **Expected**: Shows only events for that specific place
  
- [ ] **Result**: _______________

---

## Edge Cases & Error Handling

### GPS Accuracy Filter
- [ ] **Test**: Poor GPS accuracy (>50m) detected
  - **Expected**: Event suppressed, log: "Skipping geofence event - poor accuracy"
  
- [ ] **Result**: _______________

### App Killed/Background
- [ ] **Test**: Force-kill app, then enter geofence
  - **Expected**: Background task still fires alerts (if permissions granted)
  - Note: Expo limitations apply
  
- [ ] **Result**: _______________

### App Resume
- [ ] **Test**: Reopen app after background
  - **Expected**: Geofences re-register automatically
  
- [ ] **Result**: _______________

### Silent Mode Toggle
- [ ] **Test**: Settings → "Respect Silent Mode" ON
  - **Expected**: No sounds play when device silent/DND
  - Notifications still show
  
- [ ] **Result**: _______________

### Multiple Places
- [ ] **Test**: Create 3 places, 5 triggers total
  - **Expected**: All geofences register
  - Active count shows correctly on Home
  
- [ ] **Result**: _______________

### Edit/Delete Triggers
- [ ] **Test**: Edit trigger message
  - **Expected**: Update persists, new message fires
  
- [ ] **Result**: _______________

- [ ] **Test**: Delete trigger
  - **Expected**: No longer fires, removed from database
  
- [ ] **Result**: _______________

### Custom Sound (Placeholder)
- [ ] **Test**: Upload custom sound file
  - **Expected**: File validates, stored in database
  - Plays on event (when implemented)
  
- [ ] **Result**: _______________

### Supabase Connection Loss
- [ ] **Test**: Disable internet, trigger geofence event
  - **Expected**: Local notification still fires
  - SMS not sent (logs error)
  - Retries on reconnection
  
- [ ] **Result**: _______________

---

## Performance Testing

### Battery Impact
- [ ] **Test**: Monitor battery drain over 24 hours
  - **Expected**: Reasonable drain (<5% per hour)
  
- [ ] **Result**: _______________

### Location Updates Frequency
- [ ] **Test**: Check location update frequency
  - **Expected**: Updates only on significant movement
  - Not high-frequency polling
  
- [ ] **Result**: _______________

### Database Queries
- [ ] **Test**: Monitor Supabase query count
  - **Expected**: Few queries per event (efficient)
  
- [ ] **Result**: _______________

---

## UI/UX Testing

### Home Screen
- [ ] **Test**: Display shows correct active count
- [ ] **Test**: Settings button works
- [ ] **Test**: Pause banner displays correctly
- [ ] **Result**: _______________

### Place Details
- [ ] **Test**: Navigation to place details
- [ ] **Test**: Shows correct triggers for place
- [ ] **Test**: Add Trigger button works
- [ ] **Result**: _______________

### Trigger Forms
- [ ] **Test**: Add Trigger opens form
- [ ] **Test**: Template button works
- [ ] **Test**: Preview card updates live
- [ ] **Test**: Save button disabled until message entered
- [ ] **Result**: _______________

### Settings Screen
- [ ] **Test**: All toggles persist
- [ ] **Test**: Trusted contacts display correctly
- [ ] **Test**: Add contact modal works
- [ ] **Test**: Recent activity loads
- [ ] **Result**: _______________

---

## Acceptance Criteria Verification

### ✅ One Alert Per Visit
- [ ] **Arrival**: Exactly one alert per confirmed arrival
- [ ] **Departure**: Exactly one alert per confirmed departure
- [ ] **Result**: _______________

### ✅ Hysteresis Protection
- [ ] **No false departures**: Neighborhood loops don't trigger
- [ ] **Dead zone respected**: Outer radius boundary works
- [ ] **Re-entry cancels**: Departure cancelled on re-entry
- [ ] **Result**: _______________

### ✅ Cooldown Enforced
- [ ] **10 min cooldown**: Prevents duplicate alerts
- [ ] **Applies to both**: Local + remote alerts
- [ ] **Result**: _______________

### ✅ Safety Mode - Parent/Child
- [ ] **Parent receives ONE SMS** on arrival
- [ ] **Parent receives ONE SMS** on departure
- [ ] **No duplicates** on neighborhood loops
- [ ] **Result**: _______________

---

## Known Issues / Limitations

- [ ] **GPS Accuracy**: Some devices may report poor accuracy intermittently
- [ ] **Background Tasks**: Expo Go limits background task execution
- [ ] **Twilio Cost**: SMS charges apply (~$0.0075 per message)
- [ ] **iOS Simulator**: Geofencing may not work in simulator

## Notes

### Test Environment
- Device: _______________
- OS Version: _______________
- Expo Version: _______________
- Supabase Project: _______________
- Test Date: _______________

### Issues Found
(Record any bugs or unexpected behavior)

1. _______________
2. _______________
3. _______________

### Recommendations
(Record suggestions for improvement)

1. _______________
2. _______________
3. _______________

