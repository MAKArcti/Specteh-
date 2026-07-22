import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserRole } from '@spectech/shared-types';

export interface StoredProfile {
  id: string;
  fullName: string;
  phone: string;
  roles: UserRole[];
}

const PROFILES_KEY = 'spectech.profiles';

async function loadAll(): Promise<Record<string, StoredProfile>> {
  const raw = await AsyncStorage.getItem(PROFILES_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, StoredProfile>;
  } catch {
    return {};
  }
}

export async function saveProfile(profile: StoredProfile): Promise<void> {
  const all = await loadAll();
  all[profile.id] = profile;
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(all));
}

export async function getProfile(id: string): Promise<StoredProfile | null> {
  const all = await loadAll();
  return all[id] ?? null;
}
