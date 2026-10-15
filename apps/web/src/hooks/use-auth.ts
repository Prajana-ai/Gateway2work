'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';

export function useAuth() {
  const store = useAuthStore();

  useEffect(() => {
    if (!store.isHydrated) {
      store.hydrateFromStorage();
    }
  }, [store]);

  return store;
}
