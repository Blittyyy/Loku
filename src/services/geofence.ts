import * as Location from 'expo-location';
import { Place, DatabasePlace } from '../types';
import { supabase } from '../lib/supabase';

// The geofence task is defined in tasks/geofenceTask.ts
export const GEOFENCE_TASK_NAME = 'loku-geofence-task';

let isGeofencingActive = false;

/**
 * Registers geofences for places from Supabase
 */
export const registerGeofences = async (paused: boolean): Promise<void> => {
  if (paused) {
    console.log('Geofencing paused - not registering');
    await stopGeofencing();
    return;
  }

  try {
    // Check permissions
    const { status } = await Location.requestBackgroundPermissionsAsync();
    if (status !== 'granted') {
      console.log('Background location permission not granted');
      return;
    }

    // Fetch places from Supabase
    const { data: places, error } = await supabase
      .from('places')
      .select('*');

    if (error) {
      console.error('Error fetching places for geofencing:', error);
      return;
    }

    if (!places || places.length === 0) {
      console.log('No places to register for geofencing');
      return;
    }

    // Stop existing geofences first
    await stopGeofencing();

    // Register each place with inner radius
    const regions = places.map((place: DatabasePlace) => ({
      identifier: place.id,
      latitude: place.lat,
      longitude: place.lng,
      radius: place.radius, // Use inner radius for entry detection
      notifyOnEnter: true,
      notifyOnExit: true,
    }));

    await Location.startGeofencingAsync(GEOFENCE_TASK_NAME, regions);
    isGeofencingActive = true;
    console.log(`Registered ${regions.length} geofences`);
  } catch (error) {
    console.error('Error registering geofences:', error);
  }
};

/**
 * Stops all geofencing
 */
export const stopGeofencing = async (): Promise<void> => {
  try {
    await Location.stopGeofencingAsync(GEOFENCE_TASK_NAME);
    isGeofencingActive = false;
    console.log('Stopped all geofences');
  } catch (error) {
    console.error('Error stopping geofences:', error);
  }
};

/**
 * Gets current geofencing status
 */
export const isGeofencingRunning = (): boolean => {
  return isGeofencingActive;
};

