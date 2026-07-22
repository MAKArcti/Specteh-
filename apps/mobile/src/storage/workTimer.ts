import AsyncStorage from '@react-native-async-storage/async-storage';
import { WORK_TIMER_STORAGE_KEY } from '@/config';

/**
 * Purely local bookkeeping for the operator's "Почати роботу"/"Завершити
 * роботу" buttons on the Звіти tab — it never calls the API (the order is
 * already `in_work` server-side once the owner starts the contract; this
 * only captures a start timestamp so the eventual report can be pre-filled
 * with startedAt/endedAt/durationMin).
 */
async function loadAll(): Promise<Record<string, string>> {
  const raw = await AsyncStorage.getItem(WORK_TIMER_STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

async function saveAll(map: Record<string, string>): Promise<void> {
  await AsyncStorage.setItem(WORK_TIMER_STORAGE_KEY, JSON.stringify(map));
}

export async function getWorkStartedAt(orderId: string): Promise<string | null> {
  const all = await loadAll();
  return all[orderId] ?? null;
}

export async function setWorkStartedAt(orderId: string, iso: string): Promise<void> {
  const all = await loadAll();
  all[orderId] = iso;
  await saveAll(all);
}

export async function clearWorkStartedAt(orderId: string): Promise<void> {
  const all = await loadAll();
  delete all[orderId];
  await saveAll(all);
}
