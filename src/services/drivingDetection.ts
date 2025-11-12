import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { useDriving } from '../store/useDriving';
import { useSettings } from '../store/useSettings';

const SPEED_THRESHOLD_MS = 4.5; // meters per second (16.2 km/h or ~10 mph)
const DWELL_TIME_MS = 60000; // 60 seconds
const CHECK_INTERVAL_MS = 5000; // Check every 5 seconds

let detectionInterval: NodeJS.Timeout | null = null;
let locationSubscription: Location.LocationSubscription | null = null;
let speedHistory: { speed: number; timestamp: number }[] = [];

/**
 * Starts monitoring for driving detection
 */
export const startDrivingDetection = async (): Promise<void> => {
  // Check permissions
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    console.log('Location permission not granted for driving detection');
    return;
  }

  // Get settings
  const settings = useSettings.getState().settings;
  if (!settings.carModeAutoPrompt) {
    console.log('Car mode auto-prompt disabled');
    return;
  }

  const speedThreshold = settings.carModeSpeedThreshold || SPEED_THRESHOLD_MS;
  const dwellTime = settings.carModeDwellTime || DWELL_TIME_MS;

  // Clear any existing detection
  stopDrivingDetection();

  // Start location subscription
  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: CHECK_INTERVAL_MS,
      distanceInterval: 10,
    },
    (location) => {
      const speed = location.coords.speed ?? 0;
      const now = Date.now();

      // Update speed history (keep entries within dwell time window)
      speedHistory.push({ speed, timestamp: now });
      speedHistory = speedHistory.filter((entry) => now - entry.timestamp <= dwellTime + 10000); // Keep a bit extra

      // Check if we've been above threshold for the dwell time
      const recentSpeeds = speedHistory.filter((entry) => now - entry.timestamp <= dwellTime);
      if (recentSpeeds.length === 0) return;

      const avgSpeed = recentSpeeds.reduce((sum, entry) => sum + entry.speed, 0) / recentSpeeds.length;
      const minTimeElapsed = now - recentSpeeds[0].timestamp >= dwellTime;

      const drivingState = useDriving.getState();
      const isCurrentlyDriving = drivingState.isDriving;

      if (avgSpeed >= speedThreshold && minTimeElapsed) {
        // We've been driving for the required time
        if (!isCurrentlyDriving) {
          console.log('Driving detected - speed:', avgSpeed.toFixed(2), 'm/s');
          useDriving.getState().setIsDriving(true);
        }
      } else if (avgSpeed < speedThreshold * 0.5) {
        // Speed dropped significantly, likely stopped
        if (isCurrentlyDriving) {
          console.log('Driving stopped - speed:', avgSpeed.toFixed(2), 'm/s');
          useDriving.getState().setIsDriving(false);
          // Reset speed history when stopped
          speedHistory = [];
        }
      }
    }
  );

  console.log('Started driving detection');
};

/**
 * Stops monitoring for driving detection
 */
export const stopDrivingDetection = (): void => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  if (detectionInterval) {
    clearInterval(detectionInterval);
    detectionInterval = null;
  }
  speedHistory = [];
  console.log('Stopped driving detection');
};

/**
 * Initialize driving detection (call on app start)
 */
export const initDrivingDetection = async (): Promise<void> => {
  const settings = useSettings.getState().settings;
  if (settings.carModeAutoPrompt) {
    await startDrivingDetection();
  }
};

