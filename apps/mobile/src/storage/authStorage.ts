import * as SecureStore from 'expo-secure-store';
import { AUTH_TOKEN_STORAGE_KEY } from '@/config';

export async function getStoredToken(): Promise<string | null> {
  return SecureStore.getItemAsync(AUTH_TOKEN_STORAGE_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY);
}
