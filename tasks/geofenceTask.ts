import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { supabase, DatabaseTrigger } from '../src/lib/supabase';
import {
  shouldConfirmArrival,
  shouldConfirmDeparture,
  inCooldown,
  isAccurateFix,
  isWithinRadius,
  triggerArrival,
  triggerDeparture,
  GeofenceState,
} from '../src/services/arrivalState';
import { sendSafetyAlerts } from '../src/services/safetyAlerts';
import { Platform } from 'react-native';

export const GEOFENCE_TASK_NAME = 'loku-geofence-task';

// State tracking per place
interface PlaceState {
  state: GeofenceState;
  enteredAt: number | null;
  leftAt: number | null;
  lastCheck: number;
}

const placeStates = new Map<string, PlaceState>();

TaskManager.defineTask(GEOFENCE_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Geofence error:', error);
    return;
  }

  if (data) {
    const { eventType, region, location } = data as {
      eventType: Location.GeofencingEventType;
      region: {
        identifier: string;
        latitude: number;
        longitude: number;
        radius: number;
      };
      location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
      };
    };

    const placeId = region.identifier;
    const now = Date.now();

    console.log(
      `Geofence event: ${eventType === Location.GeofencingEventType.Enter ? 'ENTER' : 'EXIT'} for place ${placeId}`
    );

    // Initialize place state if needed
    if (!placeStates.has(placeId)) {
      placeStates.set(placeId, {
        state: 'outside',
        enteredAt: null,
        leftAt: null,
        lastCheck: now,
      });
    }

    const state = placeStates.get(placeId)!;
    const previousState = state.state;

    // Check accuracy if location is provided
    if (location && !isAccurateFix(location.accuracy)) {
      console.log(`Skipping geofence event - poor accuracy: ${location.accuracy}m`);
      return;
    }

    // Handle ENTER event (inner radius)
    if (eventType === Location.GeofencingEventType.Enter) {
      if (previousState === 'outside' || previousState === 'leaving') {
        // Transition to arriving
        state.state = 'arriving';
        state.enteredAt = now;
        state.leftAt = null; // Cancel departure
        console.log(`Place ${placeId}: outside → arriving`);

        // Get triggers for this place
        const { data: triggers } = await supabase
          .from('triggers')
          .select('*')
          .eq('place_id', placeId)
          .eq('type', 'arrival')
          .eq('enabled', true);

        // Schedule arrival check after dwell_ms
        if (triggers && triggers.length > 0) {
          const trigger = triggers[0] as DatabaseTrigger;
          setTimeout(async () => {
            const currentState = placeStates.get(placeId);
            if (
              currentState?.state === 'arriving' &&
              shouldConfirmArrival(currentState.enteredAt || 0, Date.now(), trigger.dwell_ms)
            ) {
              // Update state in database
              await supabase
                .from('triggers')
                .update({
                  last_state: 'inside',
                  last_event_at: new Date().toISOString(),
                  last_alert_at: new Date().toISOString(),
                })
                .eq('id', trigger.id);

              // Get place name
              const { data: place } = await supabase
                .from('places')
                .select('name')
                .eq('id', placeId)
                .single();

              // Get settings for silent mode
              const { data: settingsData } = await supabase
                .from('triggers')
                .select('respect_silent_mode')
                .eq('id', trigger.id)
                .single();

              const respectSilentMode = true; // Default, will get from settings if needed

              // Fire arrival trigger
              await triggerArrival(
                trigger.message, 
                trigger.sound_enabled, 
                place?.name || placeId, 
                trigger.id,
                respectSilentMode
              );

              // Send safety alerts if enabled
              if (trigger.notify_contacts) {
                await sendSafetyAlerts(place?.name || placeId, 'arrival', trigger.id);
              }

              // Update local state
              if (placeStates.has(placeId)) {
                placeStates.get(placeId)!.state = 'inside';
              }
            }
          }, trigger.dwell_ms);
        }
      }
    }
    // Handle EXIT event
    else if (eventType === Location.GeofencingEventType.Exit) {
      if (previousState === 'inside' || previousState === 'arriving') {
        // Check if we're still within outer radius
        const { data: place } = await supabase.from('places').select('*').eq('id', placeId).single();

        if (place && location) {
          const withinOuter = isWithinRadius(location.latitude, location.longitude, place.lat, place.lng, place.outer_radius);

          if (withinOuter) {
            // Still within outer radius - don't trigger yet
            state.state = 'leaving';
            state.leftAt = now;
            console.log(`Place ${placeId}: inside → leaving (still in outer radius)`);

            // Get triggers for this place
            const { data: triggers } = await supabase
              .from('triggers')
              .select('*')
              .eq('place_id', placeId)
              .eq('type', 'departure')
              .eq('enabled', true);

            // Schedule departure check after out_confirm_ms
            if (triggers && triggers.length > 0) {
              const trigger = triggers[0] as DatabaseTrigger;
              const hasTriggered = placeStates.has(placeId);

              setTimeout(async () => {
                const currentState = placeStates.get(placeId);
                if (
                  currentState?.state === 'leaving' &&
                  shouldConfirmDeparture(currentState.leftAt || 0, Date.now(), trigger.out_confirm_ms)
                ) {
                  // Update state in database
                  await supabase
                    .from('triggers')
                    .update({
                      last_state: 'outside',
                      last_event_at: new Date().toISOString(),
                      last_alert_at: new Date().toISOString(),
                    })
                    .eq('id', trigger.id);

                  // Get settings for silent mode
                  const respectSilentMode = true; // Default, will get from settings if needed

                  // Fire departure trigger
                  await triggerDeparture(
                    trigger.message, 
                    trigger.sound_enabled, 
                    place?.name || placeId, 
                    trigger.id,
                    respectSilentMode
                  );

                  // Send safety alerts if enabled
                  if (trigger.notify_contacts) {
                    await sendSafetyAlerts(place?.name || placeId, 'departure', trigger.id);
                  }

                  // Update local state
                  if (placeStates.has(placeId)) {
                    placeStates.get(placeId)!.state = 'outside';
                  }
                }
              }, trigger.out_confirm_ms);
            }
          } else {
            // Beyond outer radius - confirm departure
            state.state = 'outside';
            console.log(`Place ${placeId}: leaving → outside (beyond outer radius)`);
          }
        }
      }
    }

    state.lastCheck = now;
  }
});

