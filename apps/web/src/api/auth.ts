import type { UserRole } from '@spectech/shared-types';
import { api } from './client';

export interface AuthResponse {
  accessToken: string;
}

export interface RegisterPayload {
  role: UserRole;
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export function register(payload: RegisterPayload) {
  return api.post<AuthResponse>('/auth/register', payload);
}

export function login(payload: LoginPayload) {
  return api.post<AuthResponse>('/auth/login', payload);
}
