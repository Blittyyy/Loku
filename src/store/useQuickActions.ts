import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { QuickAction } from '../types';

interface QuickActionsState {
  actions: QuickAction[];
  loading: boolean;
  error: string | null;
  fetchActions: () => Promise<void>;
  addAction: (action: {
    name: string;
    group_id: string;
    message: string;
    delivery_method: 'composer' | 'loku';
  }) => Promise<QuickAction | null>;
  updateAction: (id: string, updated: Partial<QuickAction>) => Promise<void>;
  deleteAction: (id: string) => Promise<void>;
  getAction: (id: string) => QuickAction | undefined;
}

export const useQuickActions = create<QuickActionsState>((set, get) => ({
  actions: [],
  loading: false,
  error: null,

  fetchActions: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('quick_actions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ actions: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching quick actions:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to fetch actions', loading: false });
    }
  },

  addAction: async (action) => {
    try {
      const { data, error } = await supabase
        .from('quick_actions')
        .insert({
          name: action.name,
          group_id: action.group_id,
          message: action.message,
          delivery_method: action.delivery_method,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ actions: [data, ...state.actions] }));
      return data;
    } catch (error) {
      console.error('Error adding quick action:', error);
      return null;
    }
  },

  updateAction: async (id: string, updated: Partial<QuickAction>) => {
    try {
      const dbUpdate: any = {};
      if (updated.name) dbUpdate.name = updated.name;
      if (updated.group_id) dbUpdate.group_id = updated.group_id;
      if (updated.message) dbUpdate.message = updated.message;
      if (updated.delivery_method) dbUpdate.delivery_method = updated.delivery_method;

      const { error } = await supabase
        .from('quick_actions')
        .update(dbUpdate)
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        actions: state.actions.map((a) => (a.id === id ? { ...a, ...updated } : a)),
      }));
    } catch (error) {
      console.error('Error updating quick action:', error);
    }
  },

  deleteAction: async (id: string) => {
    try {
      const { error } = await supabase
        .from('quick_actions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({ actions: state.actions.filter((a) => a.id !== id) }));
    } catch (error) {
      console.error('Error deleting quick action:', error);
    }
  },

  getAction: (id: string) => get().actions.find((a) => a.id === id),
}));

