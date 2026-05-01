import { create } from 'zustand';
import { UserDto } from '@/types/auth';

interface AuthState {
  user: UserDto | null;
  setUser: (user: UserDto) => void;
  clearUser: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
