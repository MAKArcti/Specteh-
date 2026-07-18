import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { UserRole } from '@spectech/shared-types';
import * as authApi from '../api/auth';

interface Session {
  token: string;
  userId: string;
  role: UserRole;
}

interface AuthContextValue {
  session: Session | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (payload: authApi.RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_STORAGE_KEY = 'accessToken';

interface TokenPayload {
  sub: string;
  role: UserRole;
}

function decodeSession(token: string): Session | null {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as TokenPayload;
    return { token, userId: decoded.sub, role: decoded.role };
  } catch {
    return null;
  }
}

function readStoredSession(): Session | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  return token ? decodeSession(token) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readStoredSession());

  const applyToken = (token: string) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    setSession(decodeSession(token));
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      login: async (phone: string, password: string) => {
        const { accessToken } = await authApi.login({ phone, password });
        applyToken(accessToken);
      },
      register: async (payload: authApi.RegisterPayload) => {
        const { accessToken } = await authApi.register(payload);
        applyToken(accessToken);
      },
      logout: () => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setSession(null);
      },
    }),
    [session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
