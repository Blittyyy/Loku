import { Audio } from 'expo-av';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import * as Notifications from 'expo-notifications';
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
 * Gets system sound for arrival (plays actual notification sound)
 */
const getSystemArrivalSound = async (): Promise<void> => {
  try {
    // Ensure audio is initialized
    if (!isInitialized) {
      await initializeSounds();
    }
    
    // Play a notification sound immediately to get system sound
    // Use a minimal notification that will play sound but can be suppressed visually
    await Notifications.scheduleNotificationAsync({
      content: {
        title: ' ',
        body: ' ',
        sound: 'default',
        data: { silent: true, soundOnly: true },
      },
      trigger: null, // Play immediately
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.error('Error playing system arrival sound:', error);
    // Fallback to haptic only
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Gets system sound for reminder (plays actual notification sound)
 */
const getSystemReminderSound = async (): Promise<void> => {
  try {
    // Ensure audio is initialized
    if (!isInitialized) {
      await initializeSounds();
    }
    
    // Play a notification sound immediately to get system sound
    // Use a minimal notification that will play sound but can be suppressed visually
    await Notifications.scheduleNotificationAsync({
      content: {
        title: ' ',
        body: ' ',
        sound: 'default',
        data: { silent: true, soundOnly: true },
      },
      trigger: null, // Play immediately
    });
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.error('Error playing system reminder sound:', error);
    // Fallback to haptic only
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
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
 * Plays chime sound
 * Tries to load chime.mp3 (or chime.caf, chime.m4a, etc.) from assets
 * Falls back to double notification pattern if file not found
 */
export const playChimeSound = async (): Promise<void> => {
  try {
    if (!isInitialized) {
      await initializeSounds();
    }
    
    // Try to load and play chime sound file (supports .mp3, .m4a, .wav, .aac, .caf)
    try {
      let soundFile = null;
      
      // Try each format - require() must be static, so we check each one
      // Files are capitalized: Chime.mp3, Bell.mp3, Notification.mp3
      try {
        soundFile = require('../../assets/Chime.mp3');
      } catch (e) {
        try {
          soundFile = require('../../assets/chime.mp3');
        } catch (e2) {
          try {
            soundFile = require('../../assets/Chime.caf');
          } catch (e3) {
            try {
              soundFile = require('../../assets/chime.caf');
            } catch (e4) {
              throw new Error('No chime sound file found');
            }
          }
        }
      }
      
      if (soundFile) {
        const { sound } = await Audio.Sound.createAsync(
          soundFile,
          { shouldPlay: true, isLooping: false }
        );
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if ('didJustFinish' in status && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
        
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        throw new Error('No chime sound file found');
      }
    } catch (fileError) {
      // Fallback: Play two quick notifications to create a chime-like double sound
      await Notifications.scheduleNotificationAsync({
        content: {
          title: ' ',
          body: ' ',
          sound: 'default',
          data: { silent: true, soundOnly: true, soundType: 'chime' },
        },
        trigger: null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setTimeout(async () => {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: ' ',
            body: ' ',
            sound: 'default',
            data: { silent: true, soundOnly: true, soundType: 'chime' },
          },
          trigger: null,
        });
      }, 120);
    }
  } catch (error) {
    console.error('Error playing chime sound:', error);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

/**
 * Plays bell sound
 * Tries to load bell.mp3 (or bell.caf, bell.m4a, etc.) from assets
 * Falls back to notification pattern if file not found
 */
export const playBellSound = async (): Promise<void> => {
  try {
    if (!isInitialized) {
      await initializeSounds();
    }
    
    // Try to load and play bell sound file
    try {
      let soundFile = null;
      
      try {
        soundFile = require('../../assets/Bell.mp3');
      } catch (e) {
        try {
          soundFile = require('../../assets/bell.mp3');
        } catch (e2) {
          try {
            soundFile = require('../../assets/Bell.caf');
          } catch (e3) {
            try {
              soundFile = require('../../assets/bell.caf');
            } catch (e4) {
              throw new Error('No bell sound file found');
            }
          }
        }
      }
      
      if (soundFile) {
        const { sound } = await Audio.Sound.createAsync(
          soundFile,
          { shouldPlay: true, isLooping: false }
        );
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if ('didJustFinish' in status && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
        
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        throw new Error('No bell sound file found');
      }
    } catch (fileError) {
      // Fallback: Single strong notification for bell
      await Notifications.scheduleNotificationAsync({
        content: {
          title: ' ',
          body: ' ',
          sound: 'default',
          data: { silent: true, soundOnly: true, soundType: 'bell' },
        },
        trigger: null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  } catch (error) {
    console.error('Error playing bell sound:', error);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

/**
 * Plays notification sound
 * Tries to load notification.mp3 (or notification.caf, notification.m4a, etc.) from assets
 * Falls back to default notification if file not found
 */
export const playNotificationSound = async (): Promise<void> => {
  try {
    if (!isInitialized) {
      await initializeSounds();
    }
    
    // Try to load and play notification sound file
    try {
      let soundFile = null;
      
      try {
        soundFile = require('../../assets/Notification.mp3');
      } catch (e) {
        try {
          soundFile = require('../../assets/notification.mp3');
        } catch (e2) {
          try {
            soundFile = require('../../assets/Notification.caf');
          } catch (e3) {
            try {
              soundFile = require('../../assets/notification.caf');
            } catch (e4) {
              throw new Error('No notification sound file found');
            }
          }
        }
      }
      
      if (soundFile) {
        const { sound } = await Audio.Sound.createAsync(
          soundFile,
          { shouldPlay: true, isLooping: false }
        );
        
        sound.setOnPlaybackStatusUpdate((status) => {
          if (!status.isLoaded) return;
          if ('didJustFinish' in status && status.didJustFinish) {
            sound.unloadAsync();
          }
        });
        
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        throw new Error('No notification sound file found');
      }
    } catch (fileError) {
      // Fallback: Standard single notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: ' ',
          body: ' ',
          sound: 'default',
          data: { silent: true, soundOnly: true, soundType: 'notification' },
        },
        trigger: null,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (error) {
    console.error('Error playing notification sound:', error);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

