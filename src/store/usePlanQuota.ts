import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export type Plan = 'free' | 'plus' | 'pro';

export interface QuotaInfo {
  plan: Plan;
  monthly_sms_count: number;
  monthly_sms_limit: number;
  last_reset_at: string | null;
}

interface PlanQuotaState {
  quota: QuotaInfo | null;
  loading: boolean;
  error: string | null;
  fetchQuota: (userId: string) => Promise<void>;
  refreshQuota: (userId: string) => Promise<void>;
  getRemaining: () => number;
  isQuotaExceeded: (additionalCount: number) => boolean;
}

// Plan limits
const PLAN_LIMITS: Record<Plan, number> = {
  free: 30,
  plus: 200,
  pro: 1000,
};

export const usePlanQuota = create<PlanQuotaState>((set, get) => ({
  quota: null,
  loading: false,
  error: null,

  fetchQuota: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('users')
        .select('plan, monthly_sms_count, monthly_sms_limit, last_reset_at')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data) {
        set({ quota: data as QuotaInfo, loading: false });
      } else {
        // User doesn't exist, create with defaults
        // This handles the case where the user record hasn't been created yet
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            plan: 'free',
            monthly_sms_count: 0,
            monthly_sms_limit: PLAN_LIMITS.free,
            last_reset_at: new Date().toISOString(),
          })
          .select('plan, monthly_sms_count, monthly_sms_limit, last_reset_at')
          .single();

        if (createError) {
          // If insert fails (e.g., user already exists from concurrent request), try fetching again
          const { data: retryData, error: retryError } = await supabase
            .from('users')
            .select('plan, monthly_sms_count, monthly_sms_limit, last_reset_at')
            .eq('id', userId)
            .single();
          
          if (retryError) throw retryError;
          if (retryData) {
            set({ quota: retryData as QuotaInfo, loading: false });
          } else {
            throw createError;
          }
        } else {
          set({ quota: newUser as QuotaInfo, loading: false });
        }
      }
    } catch (error) {
      console.error('Error fetching quota:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch quota',
        loading: false,
      });
    }
  },

  refreshQuota: async (userId: string) => {
    await get().fetchQuota(userId);
  },

  getRemaining: () => {
    const { quota } = get();
    if (!quota) return 0;
    return Math.max(0, quota.monthly_sms_limit - quota.monthly_sms_count);
  },

  isQuotaExceeded: (additionalCount: number) => {
    const { quota } = get();
    if (!quota) return true;
    return (quota.monthly_sms_count + additionalCount) > quota.monthly_sms_limit;
  },
}));

