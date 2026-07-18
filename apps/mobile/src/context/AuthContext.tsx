import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest } from '@/api/auth';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/storage/authStorage';

interface AuthContextValue {
  token: string | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoredToken()
      .then(setToken)
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const { accessToken } = await loginRequest(phone, password);
    await setStoredToken(accessToken);
    setToken(accessToken);
  }, []);

  const logout = useCallback(async () => {
    await clearStoredToken();
    setToken(null);
  }, []);

  const value = useMemo(() => ({ token, isLoading, login, logout }), [token, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
