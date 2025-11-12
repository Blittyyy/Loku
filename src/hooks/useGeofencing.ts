import { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { registerGeofences } from '../services/geofence';
import { useSettings } from '../store/useSettings';
import { usePlaces } from '../store/usePlaces';

/**
 * Hook to manage geofencing registration
 * Re-registers when places change or app resumes
 */
export const useGeofencing = () => {
  const paused = useSettings((state) => state.settings.paused);
  const places = usePlaces((state) => state.places);

  useEffect(() => {
    // Register geofences when places change
    registerGeofences(paused);
  }, [paused, places.length]); // Re-register when paused state or places count changes

  useEffect(() => {
    // Re-register on app focus/resume
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        registerGeofences(paused);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [paused]);
};

