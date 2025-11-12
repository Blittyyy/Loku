import { createClient } from '@supabase/supabase-js';

// Get environment variables from Expo config or fallback to empty strings
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types
export type DatabasePlace = {
  id: string;
  user_id: string | null;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  radius: number;
  outer_radius: number;
  created_at: string;
};

export type DatabaseTrigger = {
  id: string;
  place_id: string;
  type: 'arrival' | 'departure';
  message: string;
  sound_enabled: boolean;
  notify_contacts: boolean;
  enabled: boolean;
  last_state: string | null;
  last_event_at: string | null;
  last_alert_at: string | null;
  dwell_ms: number;
  out_confirm_ms: number;
  cooldown_ms: number;
  created_at: string;
};

