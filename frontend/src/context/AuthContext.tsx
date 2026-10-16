'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api-client';
import {
  clearAuthSession,
  getAuthSessionValue,
  setAuthSessionValue,
} from '@/lib/auth-session';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  is_active: boolean;
  is_superuser: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const logout = useCallback(() => {
    clearAuthSession();
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await apiClient.get<User>('/users/me');
      setUser(response.data);
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      const storedToken = getAuthSessionValue('access_token');
      if (storedToken) {
        setToken(storedToken);
        void fetchCurrentUser();
      } else {
        setLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(initialLoad);
  }, [fetchCurrentUser]);

  const login = async (newToken: string) => {
    setAuthSessionValue('access_token', newToken);
    setToken(newToken);
    await fetchCurrentUser();
    router.push('/dashboard');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
