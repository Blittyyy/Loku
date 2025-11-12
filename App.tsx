import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import './tasks/geofenceTask';
import { useGeofencing } from './src/hooks/useGeofencing';

// Services
import { initNotifications } from './src/services/notifications';
import { ensurePermissions } from './src/services/location';
import { initDrivingDetection } from './src/services/drivingDetection';

// Stores
import { useContactGroups } from './src/store/useContactGroups';
import { useQuickActions } from './src/store/useQuickActions';

// Screens
import HomeScreen from './app/(tabs)/index';
import NewPlaceScreen from './app/place/new';
import PlaceDetailsScreen from './app/place/[id]';
import NewTriggerScreen from './app/trigger/new';
import EditTriggerScreen from './app/trigger/[id]';
import SettingsScreen from './app/settings/index';

export type RootStackParamList = {
  Home: undefined;
  PlaceNew: undefined;
  PlaceDetails: { id: string };
  TriggerNew: { placeId: string };
  TriggerEdit: { id: string };
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  // Initialize geofencing
  useGeofencing();

  // Initialize data stores
  const fetchGroups = useContactGroups((state) => state.fetchGroups);
  const fetchActions = useQuickActions((state) => state.fetchActions);

  // Initialize permissions on app launch
  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('Initializing app permissions...');
        
        // Request notification permissions
        await initNotifications();
        
        // Request location permissions (will prompt user on first launch)
        // We don't await this as it may take time and should not block app loading
        ensurePermissions().then((result) => {
          if (result.canUseGeofencing) {
            console.log('Location permissions granted');
          } else {
            console.log('Location permissions not granted:', result);
          }
        }).catch((error) => {
          // On iOS Simulator or if NSLocationUsageDescription is missing in Info.plist
          // This is expected in development - permissions will work on real devices or after prebuild
          if (error.message.includes('NSLocation')) {
            console.log('Location permission descriptions missing - this is expected in development mode');
          } else {
            console.log('Error requesting permissions:', error);
          }
        });

        // Fetch contact groups and quick actions
        fetchGroups();
        fetchActions();

        // Initialize driving detection
        initDrivingDetection();
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="PlaceNew" component={NewPlaceScreen} />
              <Stack.Screen name="PlaceDetails" component={PlaceDetailsScreen} />
              <Stack.Screen name="TriggerNew" component={NewTriggerScreen} />
              <Stack.Screen name="TriggerEdit" component={EditTriggerScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
        </Stack.Navigator>
        <StatusBar style="auto" />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
