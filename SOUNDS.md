# Loku - Sound System

## Overview

Loku uses **system sounds and haptic feedback** by default for arrival/departure notifications. Users can optionally upload custom sound files in popular audio formats.

## Default Behavior

### System Sounds
- **Arrival**: Uses system success notification sound + medium haptic
- **Departure**: Uses system warning notification sound + light haptic
- **Fallback**: Pure haptic feedback if sounds are disabled

### Silent Mode
- Respects device silent/DND mode based on user settings
- Setting: **Settings → Respect Silent Mode**

## Custom Sound Upload

### Supported Formats
- **MP3** (`.mp3`)
- **M4A** (`.m4a`)
- **WAV** (`.wav`)
- **AAC** (`.aac`)
- **OGG** (`.ogg`)

### How to Upload

1. In **Add/Edit Trigger** screen
2. Look for **"Custom Sound (Optional)"** section
3. Tap **"Choose Custom Sound"**
4. Select file from device
5. File is validated and stored
6. To use default sound, tap **"Remove"**

### Technical Details

**Storage:**
- Custom sounds are stored locally on device
- URI is saved in `triggers.custom_sound_uri` column
- Files are cached for offline playback

**Playback:**
- Custom sounds play through `expo-av` Audio API
- Duration limited to <2 seconds
- Single play (no looping)
- Auto-cleanup after playback

**Validation:**
- File format checked on upload
- File size limits apply (platform-dependent)
- Invalid files rejected with error message

## Settings Integration

### Trigger Settings
- **Enable Sound** toggle: Controls whether ANY sound plays
- **Custom Sound**: When provided, overrides system sound

### Global Settings
- **Pause Automations**: Disables all sounds
- **Respect Silent Mode**: Honors device silent/DND state

## Sound Pipeline

```
Arrival/Departure Confirmed
  ↓
Check: Settings.paused? → Skip if true
  ↓
Check: trigger.sound_enabled? → Skip sound if false
  ↓
Check: respectSilentMode? → Skip sound if silent
  ↓
Has custom_sound_uri? 
  ├─ YES → playCustomSound(custom_sound_uri)
  └─ NO  → playArrival() / playReminder() (system sounds + haptics)
  ↓
Send notification (with haptic)
  ↓
Log to database
```

## Implementation

### Files
- `src/services/sounds.ts` - Sound playback logic
- `src/components/SoundPicker.tsx` - File picker UI
- `supabase-schema.sql` - Database schema (custom_sound_uri column)

### Key Functions

**`playArrival(soundEnabled, respectSilentMode)`**
- Plays arrival sound if enabled
- Uses system sound + haptic by default
- Can use custom sound if provided

**`playReminder(soundEnabled, respectSilentMode)`**
- Plays departure sound if enabled
- Uses system sound + haptic by default
- Can use custom sound if provided

**`playCustomSound(soundUri, respectSilentMode)`**
- Loads and plays custom sound file
- Validates format before playback
- Auto-cleanup after playing

**`validateAudioFile(uri)`**
- Checks file extension against supported formats
- Returns true if valid format

## User Experience

### Default (No Custom Sound)
- Clean, native system sounds
- Consistent with device settings
- Works immediately, no setup needed

### Custom Sounds
- Personalize arrival/departure alerts
- Upload favorite notification tones
- Sound preview when testing triggers

### Best Practices
- Keep custom sounds <2 seconds
- Use clear, single-note sounds
- Test on device before relying on them
- Consider file size for performance

## Testing

### Test System Sounds
1. Create trigger with "Enable Sound" ON
2. Simulate arrival/departure
3. Should hear system sound + feel haptic

### Test Custom Sound
1. Upload custom sound file
2. Create trigger with sound enabled
3. Simulate event
4. Should hear custom sound + feel haptic

### Test Silent Mode
1. Enable "Respect Silent Mode" in Settings
2. Put device in silent/DND mode
3. Trigger should only show visual notification
4. No sound should play

## Why System Sounds?

### Advantages
- ✅ No app size bloat (users don't download sound files)
- ✅ Native OS integration
- ✅ Respects system-level audio settings
- ✅ Consistent with platform conventions
- ✅ Works offline, no file storage needed

### Custom Sound Benefits
- ✅ Personalization
- ✅ Unique audio identity
- ✅ Brand consistency
- ✅ Special occasions (birthday, holidays)

## Future Enhancements

- [ ] Sound library of pre-made tones
- [ ] Sound recording within app
- [ ] Volume control per trigger
- [ ] Different sounds for different times of day
- [ ] Sound fade-in/fade-out effects

