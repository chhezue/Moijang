import { createStore, useStore } from "zustand";
import { createContext, useContext } from "react";
import { UserDto } from "@/types/auth";

interface AuthState {
  user: UserDto | null;
  setUser: (user: UserDto) => void;
  clearUser: () => void;
}

export type AuthStoreApi = ReturnType<typeof createAuthStore>;

export const createAuthStore = (initialUser: UserDto | null) =>
  createStore<AuthState>()((set) => ({
    user: initialUser,
    setUser: (user) => set({ user }),
    clearUser: () => set({ user: null }),
  }));

export const AuthStoreContext = createContext<AuthStoreApi | null>(null);

export function useAuthStore<T>(selector: (state: AuthState) => T): T {
  const store = useContext(AuthStoreContext);
  if (!store) throw new Error("useAuthStore must be used within AuthStoreProvider");
  return useStore(store, selector);
}
