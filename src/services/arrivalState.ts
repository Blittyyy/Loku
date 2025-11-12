import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';
import { playArrival, playReminder } from './sounds';

// State machine states for visit-based geofencing
export type GeofenceState = 'outside' | 'arriving' | 'inside' | 'leaving';

/**
 * Checks if enough time has passed to confirm arrival (dwell period)
 */
export const shouldConfirmArrival = (
  enteredAt: number,
  now: number,
  dwellMs: number
): boolean => {
  return (now - enteredAt) >= dwellMs;
};

/**
 * Checks if enough time has passed to confirm departure (confirmation period)
 */
export const shouldConfirmDeparture = (
  leftAt: number,
  now: number,
  outConfirmMs: number
): boolean => {
  return (now - leftAt) >= outConfirmMs;
};

/**
 * Checks if we're in a cooldown period (prevents duplicate alerts)
 */
export const inCooldown = (
  lastAlertAt: string | null,
  now: number,
  cooldownMs: number
): boolean => {
  if (!lastAlertAt) return false;
  const lastAlert = new Date(lastAlertAt).getTime();
  return (now - lastAlert) < cooldownMs;
};

/**
 * Checks if location accuracy is acceptable
 */
export const isAccurateFix = (accuracy: number | null | undefined): boolean => {
  return accuracy !== null && accuracy !== undefined && accuracy <= 50;
};

/**
 * Calculates distance between two coordinates (Haversine formula)
 * Returns distance in meters
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Checks if a location is within a radius
 */
export const isWithinRadius = (
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radius: number
): boolean => {
  const distance = calculateDistance(lat, lng, centerLat, centerLng);
  return distance <= radius;
};

/**
 * Triggers arrival notification and logs event
 */
export const triggerArrival = async (
  message: string,
  soundEnabled: boolean,
  placeName: string,
  triggerId: string,
  respectSilentMode: boolean
) => {
  console.log('🎉 Arrival confirmed:', message);

  // Play sound if enabled
  if (soundEnabled) {
    await playArrival(soundEnabled, respectSilentMode);
  }

  // Send notification with haptics
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Loku',
      body: message,
      data: { type: 'arrival', triggerId, placeName },
    },
    trigger: null,
  });

  // Additional haptic feedback
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

  // Log to database
  try {
    await supabase.from('trigger_logs').insert({
      place_name: placeName,
      event_type: 'arrival',
    });
  } catch (error) {
    console.error('Error logging arrival:', error);
  }
};

/**
 * Triggers departure notification and logs event
 */
export const triggerDeparture = async (
  message: string,
  soundEnabled: boolean,
  placeName: string,
  triggerId: string,
  respectSilentMode: boolean
) => {
  console.log('👋 Departure confirmed:', message);

  // Play sound if enabled
  if (soundEnabled) {
    await playReminder(soundEnabled, respectSilentMode);
  }

  // Send notification with haptics
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Loku',
      body: message,
      data: { type: 'departure', triggerId, placeName },
    },
    trigger: null,
  });

  // Additional haptic feedback
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

  // Log to database
  try {
    await supabase.from('trigger_logs').insert({
      place_name: placeName,
      event_type: 'departure',
    });
  } catch (error) {
    console.error('Error logging departure:', error);
  }
};

