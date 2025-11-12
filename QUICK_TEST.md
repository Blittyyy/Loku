# Loku - Quick Test Guide

## Fast Track Testing (30 minutes)

### Essential Tests

1. **Setup** (5 min)
   - [ ] Start Expo app
   - [ ] Grant all permissions
   - [ ] Run `supabase-migration.sql` in Supabase

2. **Basic Geofencing** (10 min)
   - [ ] Create "Home" place (any location)
   - [ ] Add arrival trigger with template
   - [ ] Enter geofence → wait 2 min → verify alert
   - [ ] Add departure trigger
   - [ ] Leave geofence → wait 5 min → verify alert

3. **Templates** (5 min)
   - [ ] Use 3 different templates
   - [ ] Verify fields pre-fill correctly
   - [ ] Save and test

4. **Safety Mode** (10 min)
   - [ ] Enable Safety Mode in Settings
   - [ ] Add your phone as trusted contact
   - [ ] Create trigger with "Notify Contacts" ON
   - [ ] Enter geofence → verify SMS received
   - [ ] Check Recent Activity → verify log entry

### Verify Acceptance Criteria
- [ ] One alert per arrival ✅
- [ ] One alert per departure ✅
- [ ] No false alerts on loops ✅
- [ ] Safety Mode sends SMS ✅

---

## Common Issues

### Alerts not firing?
- [ ] Check permissions (location background + notifications)
- [ ] Verify trigger is enabled
- [ ] Check settings.paused = false
- [ ] Wait full dwell_ms (2 min)

### SMS not sending?
- [ ] Verify Safety Mode + Notify Contacts ON
- [ ] Check contact has phone number
- [ ] Verify Twilio credentials in Supabase
- [ ] Check Supabase Edge Function logs

### Templates not showing?
- [ ] Refresh app
- [ ] Check console for errors

---

## Success Criteria

✅ All Manual Tests: 100% pass  
✅ All Edge Cases: Handled gracefully  
✅ Acceptance Criteria: All met  
✅ Performance: No crashes, smooth UI  
✅ Safety Mode: SMS delivered reliably  

