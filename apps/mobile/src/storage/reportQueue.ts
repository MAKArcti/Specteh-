import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReportDraft, ReportSyncItemResult } from '@spectech/shared-types';
import { REPORT_QUEUE_STORAGE_KEY } from '@/config';

/**
 * A queued draft that failed its last sync attempt gets annotated in place so
 * the pending-reports view can show why, without losing the draft.
 */
export interface QueuedReportDraft extends ReportDraft {
  lastRejectionReason?: string;
}

// AsyncStorage over SQLite: a Phase-1 MVP queue of a few dozen JSON records
// per operator doesn't need an embedded relational DB.
export async function loadQueue(): Promise<QueuedReportDraft[]> {
  const raw = await AsyncStorage.getItem(REPORT_QUEUE_STORAGE_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedReportDraft[]) : [];
  } catch {
    return [];
  }
}

async function saveQueue(queue: QueuedReportDraft[]): Promise<void> {
  await AsyncStorage.setItem(REPORT_QUEUE_STORAGE_KEY, JSON.stringify(queue));
}

/**
 * Upserts by `clientReportId` — editing an unconfirmed report reuses the same
 * id (see reports.ts / the SoW's "edit until confirmed" flow), so a second
 * enqueue for the same id must replace the queued draft, not duplicate it.
 */
export async function enqueueReport(draft: ReportDraft): Promise<void> {
  const queue = await loadQueue();
  const index = queue.findIndex((item) => item.clientReportId === draft.clientReportId);
  if (index >= 0) {
    queue[index] = { ...draft };
  } else {
    queue.push({ ...draft });
  }
  await saveQueue(queue);
}

export async function getQueuedReport(clientReportId: string): Promise<QueuedReportDraft | undefined> {
  const queue = await loadQueue();
  return queue.find((item) => item.clientReportId === clientReportId);
}

/**
 * Reconciles the persisted queue against a sync response: accepted drafts are
 * removed, rejected ones are kept (annotated with the reason) so the operator
 * can retry or edit them, and anything the response didn't mention (e.g. the
 * request never reached the server) is left untouched for the next attempt.
 */
export async function reconcileQueue(results: ReportSyncItemResult[]): Promise<QueuedReportDraft[]> {
  const queue = await loadQueue();
  const resultById = new Map(results.map((result) => [result.clientReportId, result]));

  const remaining = queue
    .filter((draft) => resultById.get(draft.clientReportId)?.accepted !== true)
    .map((draft) => {
      const result = resultById.get(draft.clientReportId);
      if (result && !result.accepted) {
        return { ...draft, lastRejectionReason: result.rejectionReason ?? 'Відхилено сервером' };
      }
      return draft;
    });

  await saveQueue(remaining);
  return remaining;
}
