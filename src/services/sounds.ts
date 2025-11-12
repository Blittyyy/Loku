import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system';
import { Alert } from 'react-native';

// Sound state
let arrivalSound: Audio.Sound | null = null;
let reminderSound: Audio.Sound | null = null;
let isInitialized = false;

/**
 * Supported audio formats for custom sound upload
 */
export const SUPPORTED_AUDIO_FORMATS = ['.mp3', '.m4a', '.wav', '.aac', '.ogg'];

/**
 * Initializes audio system
 */
export const initializeSounds = async (): Promise<void> => {
  if (isInitialized) return;

  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    });

    console.log('Sounds initialized');
    isInitialized = true;
  } catch (error) {
    console.error('Error initializing sounds:', error);
  }
};

/**
 * Loads a sound from a URI (can be local file or remote URL)
 */
const loadSound = async (soundUri: string): Promise<Audio.Sound | null> => {
  try {
    console.log(`Loading sound from: ${soundUri}`);
    
    const { sound } = await Audio.Sound.createAsync(
      { uri: soundUri },
      { shouldPlay: false, isLooping: false }
    );
    
    return sound;
  } catch (error) {
    console.error(`Error loading sound from ${soundUri}:`, error);
    return null;
  }
};

/**
 * Gets system sound for arrival (falls back to haptic)
 */
const getSystemArrivalSound = async (): Promise<void> => {
  // System notification sound using haptics as fallback
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
};

/**
 * Gets system sound for reminder (falls back to haptic)
 */
const getSystemReminderSound = async (): Promise<void> => {
  // System notification sound using haptics as fallback
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
};

/**
 * Validates if uploaded audio file is in supported format
 */
export const validateAudioFile = (uri: string): boolean => {
  const extension = uri.substring(uri.lastIndexOf('.')).toLowerCase();
  return SUPPORTED_AUDIO_FORMATS.includes(extension);
};

/**
 * Checks if device is in silent/DND mode (best-effort)
 */
export const shouldPlaySound = async (respectSilentMode: boolean): Promise<boolean> => {
  if (!respectSilentMode) return true;

  // On iOS, we can't reliably detect silent mode in React Native
  // The `playsInSilentModeIOS` setting handles this
  // On Android, we trust the user's settings
  return true; // Will play if allowed by device settings
};

/**
 * Plays arrival sound if enabled and not in silent mode
 */
export const playArrival = async (soundEnabled: boolean, respectSilentMode: boolean): Promise<void> => {
  if (!soundEnabled) return;

  const canPlay = await shouldPlaySound(respectSilentMode);
  if (!canPlay) {
    console.log('Skipping sound - silent mode');
    return;
  }

  try {
    // For now, use system sound + haptic feedback
    // Users can upload custom sounds which will be stored per-trigger
    await getSystemArrivalSound();
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    console.log('Playing arrival sound');
  } catch (error) {
    console.error('Error playing arrival sound:', error);
  }
};

/**
 * Plays reminder sound if enabled and not in silent mode
 */
export const playReminder = async (soundEnabled: boolean, respectSilentMode: boolean): Promise<void> => {
  if (!soundEnabled) return;

  const canPlay = await shouldPlaySound(respectSilentMode);
  if (!canPlay) {
    console.log('Skipping sound - silent mode');
    return;
  }

  try {
    // For now, use system sound + haptic feedback
    // Users can upload custom sounds which will be stored per-trigger
    await getSystemReminderSound();
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    console.log('Playing reminder sound');
  } catch (error) {
    console.error('Error playing reminder sound:', error);
  }
};

/**
 * Plays a custom uploaded sound
 * @param soundUri - URI to the custom sound file
 */
export const playCustomSound = async (
  soundUri: string,
  respectSilentMode: boolean
): Promise<void> => {
  const canPlay = await shouldPlaySound(respectSilentMode);
  if (!canPlay) {
    console.log('Skipping custom sound - silent mode');
    return;
  }

  try {
    const sound = await loadSound(soundUri);
    if (sound) {
      await sound.setPositionAsync(0);
      await sound.playAsync();
      
      // Cleanup after playing
      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;
        if ('didJustFinish' in status && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    }
  } catch (error) {
    console.error('Error playing custom sound:', error);
  }
};

/**
 * Cleanup sounds
 */
export const cleanupSounds = async (): Promise<void> => {
  try {
    if (arrivalSound) {
      await arrivalSound.unloadAsync();
      arrivalSound = null;
    }
    if (reminderSound) {
      await reminderSound.unloadAsync();
      reminderSound = null;
    }
  } catch (error) {
    console.error('Error cleaning up sounds:', error);
  }
};

