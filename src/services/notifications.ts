import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    // Suppress visual notification if marked as sound-only
    const isSoundOnly = notification.request.content.data?.soundOnly === true;
    
    return {
      shouldShowAlert: !isSoundOnly,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: !isSoundOnly,
      shouldShowList: !isSoundOnly,
    };
  },
});

/**
 * Initializes notifications by requesting permissions.
 * Call this on app startup.
 */
export const initNotifications = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return status === 'granted';
  } catch (error) {
    console.error('Error initializing notifications:', error);
    return false;
  }
};

/**
 * Sends a local notification immediately with haptic feedback.
 * @param title - Notification title
 * @param body - Notification body
 */
export const sendLocal = async (title: string, body: string): Promise<void> => {
  try {
    // Check if we have permission
    const { status } = await Notifications.getPermissionsAsync();
    
    if (status !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { timestamp: Date.now() },
      },
      trigger: null, // Send immediately
    });

    console.log(`Sent notification: ${title} - ${body}`);

    // Add haptic feedback
    try {
      const { default: Haptics } = await import('expo-haptics');
      if (Haptics && Haptics.notificationAsync) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (hapticError) {
      // Haptics not available (e.g., in simulator) - ignore
      console.log('Haptics not available');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * Sends notification for geofence events with haptic feedback
 */
export const sendLocalForEvent = async (
  eventType: 'arrival' | 'departure',
  placeName: string,
  message: string
): Promise<void> => {
  const title = 'Loku';
  const body = message || (
    eventType === 'arrival' 
      ? `Arrival reminder` 
      : `You left ${placeName}`
  );

  await sendLocal(title, body);
};

/**
 * Requests notification permissions.
 * @returns true if permission granted
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Sends a test notification.
 * Used by the Settings screen.
 */
export const sendTestNotification = async (): Promise<void> => {
  await sendLocal('Loku', 'Test notification');
};

