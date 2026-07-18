import { apiRequest } from './client';

export interface LoginResponse {
  accessToken: string;
}

export async function login(phone: string, password: string): Promise<LoginResponse> {
  return apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: { phone, password },
  });
}
