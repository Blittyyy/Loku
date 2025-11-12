import * as Location from 'expo-location';
import { Platform } from 'react-native';
import { Place } from '../types';

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

/**
 * Requests and ensures all required location permissions are granted.
 * - Foreground location permission
 * - Background location permission
 * - Temporary full accuracy (iOS only, when needed)
 */
export const ensurePermissions = async (): Promise<{
  foreground: PermissionStatus;
  background: PermissionStatus;
  canUseGeofencing: boolean;
}> => {
  // Request foreground permission
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  
  if (foregroundStatus !== 'granted') {
    return {
      foreground: foregroundStatus as PermissionStatus,
      background: 'denied',
      canUseGeofencing: false,
    };
  }

  // Request background permission
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  
  if (backgroundStatus !== 'granted') {
    return {
      foreground: foregroundStatus as PermissionStatus,
      background: backgroundStatus as PermissionStatus,
      canUseGeofencing: false,
    };
  }

  // Note: For iOS temporary full accuracy, the InfoPlist configuration
  // in app.json handles the purpose description

  return {
    foreground: foregroundStatus as PermissionStatus,
    background: backgroundStatus as PermissionStatus,
    canUseGeofencing: true,
  };
};

/**
 * Gets the current device position.
 * @throws Error if location permission is not granted
 */
export const getCurrentPosition = async (): Promise<Location.LocationObject> => {
  const { status } = await Location.getForegroundPermissionsAsync();
  
  if (status !== 'granted') {
    throw new Error('Location permission not granted');
  }

  return await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });
};

/**
 * Registers geofences for the provided places.
 * Note: Geofencing logic is implemented in tasks/geofenceTask.ts
 */
export const registerGeofences = async (places: Place[]): Promise<void> => {
  try {
    const { canUseGeofencing } = await ensurePermissions();
    
    if (!canUseGeofencing) {
      throw new Error('Geofencing permissions not granted');
    }

    // Start geofencing with the places
    const regions = places.map((place) => ({
      identifier: place.id,
      latitude: place.lat,
      longitude: place.lng,
      radius: place.radius,
      notifyOnEnter: true,
      notifyOnExit: true,
    }));

    await Location.startGeofencingAsync('geofence-tracking', regions);
    
    console.log(`Registered ${places.length} geofences`);
  } catch (error) {
    console.error('Error registering geofences:', error);
    throw error;
  }
};

/**
 * Unregisters all geofences.
 */
export const unregisterGeofences = async (): Promise<void> => {
  try {
    await Location.stopGeofencingAsync('geofence-tracking');
    console.log('Unregistered all geofences');
  } catch (error) {
    console.error('Error unregistering geofences:', error);
    throw error;
  }
};

