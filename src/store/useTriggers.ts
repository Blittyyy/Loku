import { create } from 'zustand';
import { Trigger } from '../types';
import { supabase, DatabaseTrigger } from '../lib/supabase';

// Helper to convert database trigger to app trigger
const dbTriggerToTrigger = (dbTrigger: DatabaseTrigger): Trigger => ({
  id: dbTrigger.id,
  placeId: dbTrigger.place_id,
  type: dbTrigger.type,
  message: dbTrigger.message,
  soundEnabled: dbTrigger.sound_enabled,
  enabled: dbTrigger.enabled,
  createdAt: dbTrigger.created_at,
});

interface TriggersState {
  triggers: Trigger[];
  activeCount: number;
  loading: boolean;
  error: string | null;
  fetchTriggers: () => Promise<void>;
  fetchTriggersByPlaceId: (placeId: string) => Promise<void>;
  addTrigger: (trigger: Omit<Trigger, 'id' | 'createdAt'>) => Promise<Trigger | null>;
  updateTrigger: (id: string, trigger: Partial<Trigger>) => Promise<void>;
  deleteTrigger: (id: string) => Promise<void>;
  getTriggersByPlaceId: (placeId: string) => Trigger[];
  getTrigger: (id: string) => Trigger | undefined;
}

export const useTriggers = create<TriggersState>((set, get) => ({
  triggers: [],
  activeCount: 0,
  loading: false,
  error: null,

  fetchTriggers: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('triggers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const triggers = data?.map(dbTriggerToTrigger) || [];
      const activeCount = triggers.filter((t) => t.enabled).length;
      set({ triggers, activeCount, loading: false });
    } catch (error) {
      console.error('Error fetching triggers:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch triggers', loading: false });
    }
  },

  fetchTriggersByPlaceId: async (placeId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('triggers')
        .select('*')
        .eq('place_id', placeId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const newTriggers = data?.map(dbTriggerToTrigger) || [];
      
      // Merge with existing triggers (replace place's triggers)
      set((state) => {
        const otherTriggers = state.triggers.filter((t) => t.placeId !== placeId);
        const allTriggers = [...otherTriggers, ...newTriggers];
        const activeCount = allTriggers.filter((t) => t.enabled).length;
        return { triggers: allTriggers, activeCount, loading: false };
      });
    } catch (error) {
      console.error('Error fetching triggers by place:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch triggers', loading: false });
    }
  },

  addTrigger: async (trigger) => {
    try {
      const { data, error } = await supabase
        .from('triggers')
        .insert({
          place_id: trigger.placeId,
          type: trigger.type,
          message: trigger.message,
          sound_enabled: trigger.soundEnabled,
          enabled: trigger.enabled,
        })
        .select()
        .single();

      if (error) throw error;

      const newTrigger = dbTriggerToTrigger(data);
      set((state) => {
        const newTriggers = [...state.triggers, newTrigger];
        const activeCount = newTriggers.filter((t) => t.enabled).length;
        return { triggers: newTriggers, activeCount };
      });
      return newTrigger;
    } catch (error) {
      console.error('Error adding trigger:', error);
      return null;
    }
  },

  updateTrigger: async (id: string, updated: Partial<Trigger>) => {
    try {
      const dbUpdate: any = {};
      if (updated.type) dbUpdate.type = updated.type;
      if (updated.message !== undefined) dbUpdate.message = updated.message;
      if (updated.soundEnabled !== undefined) dbUpdate.sound_enabled = updated.soundEnabled;
      if (updated.enabled !== undefined) dbUpdate.enabled = updated.enabled;

      const { error } = await supabase
        .from('triggers')
        .update(dbUpdate)
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const newTriggers = state.triggers.map((t) => (t.id === id ? { ...t, ...updated } : t));
        const activeCount = newTriggers.filter((t) => t.enabled).length;
        return { triggers: newTriggers, activeCount };
      });
    } catch (error) {
      console.error('Error updating trigger:', error);
    }
  },

  deleteTrigger: async (id: string) => {
    try {
      const { error } = await supabase
        .from('triggers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => {
        const newTriggers = state.triggers.filter((t) => t.id !== id);
        const activeCount = newTriggers.filter((t) => t.enabled).length;
        return { triggers: newTriggers, activeCount };
      });
    } catch (error) {
      console.error('Error deleting trigger:', error);
    }
  },

  getTriggersByPlaceId: (placeId: string) =>
    get().triggers.filter((t) => t.placeId === placeId),
  
  getTrigger: (id: string) => get().triggers.find((t) => t.id === id),
}));

