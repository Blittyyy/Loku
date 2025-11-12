import { create } from 'zustand';

interface AuthState {
  user: { id: string; email: string } | null;
  setUser: (user: { id: string; email: string } | null) => void;
  isAuthenticated: boolean;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  isAuthenticated: false,
}));

