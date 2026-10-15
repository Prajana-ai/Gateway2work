import { create } from 'zustand';
import {
  getStoredTokens,
  setStoredTokens,
  clearTokens,
} from '@/lib/auth';

export interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  roleName: string;
  zones: string[];
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
}

interface AuthActions {
  login: (tokens: AuthTokens, user: AuthUser) => void;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  setTokens: (tokens: AuthTokens) => void;
  hydrateFromStorage: () => void;
}

export type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isAuthenticated: false,
  isHydrated: false,

  login: (tokens, user) => {
    setStoredTokens(tokens.accessToken, tokens.refreshToken);
    localStorage.setItem('auth_user', JSON.stringify(user));
    document.cookie = 'has_session=1; path=/; SameSite=Lax';
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
      isAuthenticated: true,
    });
  },

  logout: () => {
    clearTokens();
    localStorage.removeItem('auth_user');
    document.cookie = 'has_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      isAuthenticated: false,
    });
  },

  setUser: (user) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    set({ user });
  },

  setTokens: (tokens) => {
    setStoredTokens(tokens.accessToken, tokens.refreshToken);
    set({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      isAuthenticated: true,
    });
  },

  hydrateFromStorage: () => {
    const tokens = getStoredTokens();
    const userJson = localStorage.getItem('auth_user');
    const user = userJson ? (JSON.parse(userJson) as AuthUser) : null;

    if (tokens.accessToken && user) {
      set({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user,
        isAuthenticated: true,
        isHydrated: true,
      });
    } else {
      set({ isHydrated: true });
    }
  },
}));
