export type Place = {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  radius: number;
  outerRadius?: number;
  createdAt: string;
};

export type Trigger = {
  id: string;
  placeId: string;
  type: 'arrival' | 'departure';
  message: string;
  soundEnabled: boolean;
  customSoundUri?: string | null;
  soundType?: 'default' | 'custom';
  enabled: boolean;
  createdAt: string;
};

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

export type ContactGroup = {
  id: string;
  user_id: string | null;
  name: string;
  created_at: string;
};

export type ContactGroupMember = {
  id: string;
  group_id: string;
  contact_id: string;
  created_at: string;
};

export type QuickAction = {
  id: string;
  user_id: string | null;
  name: string;
  group_id: string;
  message: string;
  delivery_method: 'composer' | 'loku';
  created_at: string;
};

export type Plan = 'free' | 'plus' | 'pro';

export type UserQuota = {
  plan: Plan;
  monthly_sms_count: number;
  monthly_sms_limit: number;
  last_reset_at: string | null;
};

