import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Settings {
  paused: boolean;
  respectSilentMode: boolean;
  safetyMode: boolean;
  notifyContacts: boolean;
  // Car Mode settings
  carModeAutoPrompt: boolean;
  carModeSpeedThreshold: number; // m/s
  carModeDwellTime: number; // ms
  carModeBleUuid?: string; // iOS only: optional BLE tag UUID
  // Quick Actions settings
  quickActionsDefaultDelivery: 'composer' | 'loku';
}

interface SettingsState {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        paused: false,
        respectSilentMode: true,
        safetyMode: false,
        notifyContacts: false,
        carModeAutoPrompt: false,
        carModeSpeedThreshold: 4.5, // 4.5 m/s default
        carModeDwellTime: 60000, // 60 seconds default
        quickActionsDefaultDelivery: 'composer',
      },
      updateSettings: (newSettings) =>
        set((state) => {
          const updated = { ...state.settings, ...newSettings };
          // Auto-enable notifyContacts when safetyMode is enabled
          if (updated.safetyMode && !updated.notifyContacts) {
            updated.notifyContacts = true;
          }
          return { settings: updated };
        }),
    }),
    {
      name: 'loku-settings',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        },
      },
    }
  )
);

