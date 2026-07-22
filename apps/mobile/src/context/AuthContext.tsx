import type { UserRole } from '@spectech/shared-types';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { login as loginRequest, register as registerRequest } from '@/api/auth';
import { setAuthToken } from '@/api/client';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/storage/authStorage';
import { getProfile, saveProfile, type StoredProfile } from '@/storage/profileStorage';
import { decodeJwtPayload } from '@/utils/jwt';

export interface RegisterInput {
  roles: UserRole[];
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}

interface AuthContextValue {
  token: string | null;
  profile: StoredProfile | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const stored = await getStoredToken();
      if (stored) {
        setAuthToken(stored);
        const payload = decodeJwtPayload(stored);
        const cached = await getProfile(payload.sub);
        setProfile(cached ?? { id: payload.sub, roles: payload.roles, fullName: '', phone: '' });
        setToken(stored);
      }
      setIsLoading(false);
    })();
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const { accessToken } = await loginRequest({ phone, password });
    await setStoredToken(accessToken);
    setAuthToken(accessToken);

    const payload = decodeJwtPayload(accessToken);
    let cached = await getProfile(payload.sub);
    if (!cached) {
      // First login on this device for this account: the backend has no
      // GET /users/me, so fullName has no source yet — fall back to the
      // phone number until a register happened here, or the value gets
      // corrected once available.
      cached = { id: payload.sub, roles: payload.roles, fullName: phone, phone };
      await saveProfile(cached);
    } else if (JSON.stringify(cached.roles) !== JSON.stringify(payload.roles)) {
      cached = { ...cached, roles: payload.roles };
      await saveProfile(cached);
    }
    setProfile(cached);
    setToken(accessToken);
  }, []);

  const register = useCallback(async (input: RegisterInput) => {
    const { accessToken } = await registerRequest(input);
    await setStoredToken(accessToken);
    setAuthToken(accessToken);

    const payload = decodeJwtPayload(accessToken);
    const newProfile: StoredProfile = {
      id: payload.sub,
      roles: input.roles,
      fullName: input.fullName,
      phone: input.phone,
    };
    await saveProfile(newProfile);
    setProfile(newProfile);
    setToken(accessToken);
  }, []);

  const logout = useCallback(async () => {
    await clearStoredToken();
    setAuthToken(null);
    setToken(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({ token, profile, isLoading, login, register, logout }),
    [token, profile, isLoading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
