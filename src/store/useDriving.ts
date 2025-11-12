import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface DrivingState {
  isDriving: boolean;
  lastChangeAt: Date | null;
  lastPromptAt: Date | null;
  setIsDriving: (isDriving: boolean) => void;
  shouldShowPrompt: () => boolean;
  markPromptShown: () => void;
}

const COOLDOWN_MS = 15 * 60 * 1000; // 15 minutes

export const useDriving = create<DrivingState>()(
  persist(
    (set, get) => ({
      isDriving: false,
      lastChangeAt: null,
      lastPromptAt: null,

      setIsDriving: (isDriving: boolean) => {
        const now = new Date();
        set({
          isDriving,
          lastChangeAt: now,
        });
      },

      shouldShowPrompt: () => {
        const state = get();
        if (!state.isDriving) return false;
        if (!state.lastPromptAt) return true;
        
        const timeSinceLastPrompt = Date.now() - state.lastPromptAt.getTime();
        return timeSinceLastPrompt >= COOLDOWN_MS;
      },

      markPromptShown: () => {
        set({ lastPromptAt: new Date() });
      },
    }),
    {
      name: 'loku-driving',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          if (!value) return null;
          const parsed = JSON.parse(value);
          // Convert date strings back to Date objects
          if (parsed.state?.lastChangeAt) {
            parsed.state.lastChangeAt = new Date(parsed.state.lastChangeAt);
          }
          if (parsed.state?.lastPromptAt) {
            parsed.state.lastPromptAt = new Date(parsed.state.lastPromptAt);
          }
          return parsed;
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

