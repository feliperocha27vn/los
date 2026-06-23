import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
}

interface SessionState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setSession: (user: User | null) => void;
  setInitialized: (initialized: boolean) => void;
  logout: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  setSession: (user) => set({ user, isAuthenticated: !!user }),
  setInitialized: (isInitialized) => set({ isInitialized }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
