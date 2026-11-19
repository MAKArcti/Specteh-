import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { AUTH_TOKEN_STORAGE_KEY } from '@/config';

// expo-secure-store has no web implementation (Expo docs: "Web: Not
// supported" — it wraps iOS Keychain / Android Keystore). The real target
// platform here is Android, but falling back to localStorage on web keeps
// `expo start --web` usable for quick checks instead of crashing on load.
const isWeb = Platform.OS === 'web';

export async function getStoredToken(): Promise<string | null> {
  if (isWeb) return window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
  return SecureStore.getItemAsync(AUTH_TOKEN_STORAGE_KEY);
}

export async function setStoredToken(token: string): Promise<void> {
  if (isWeb) {
    window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    return;
  }
  await SecureStore.setItemAsync(AUTH_TOKEN_STORAGE_KEY, token);
}

export async function clearStoredToken(): Promise<void> {
  if (isWeb) {
    window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    return;
  }
  await SecureStore.deleteItemAsync(AUTH_TOKEN_STORAGE_KEY);
}
