import type { UserRole } from '@spectech/shared-types';
import { api } from './client';

export interface AuthResponse {
  accessToken: string;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface RegisterPayload {
  roles: UserRole[];
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}

export function login(payload: LoginPayload) {
  return api.post<AuthResponse>('/auth/login', payload);
}

export function register(payload: RegisterPayload) {
  return api.post<AuthResponse>('/auth/register', payload);
}
