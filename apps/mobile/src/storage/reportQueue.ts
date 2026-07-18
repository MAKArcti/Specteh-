import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ReportDraft, ReportSyncItemResult } from '@spectech/shared-types';
import { REPORT_QUEUE_STORAGE_KEY } from '@/config';

/**
 * A queued draft that failed its last sync attempt gets annotated in place so
 * the "Pending reports" screen can show why, without losing the draft (the
 * operator may be able to fix and resubmit, or it may need owner attention).
 */
export interface QueuedReportDraft extends ReportDraft {
  lastRejectionReason?: string;
}

// AsyncStorage over SQLite: a Phase-1 MVP queue of a few dozen JSON records
// per operator doesn't need an embedded relational DB, and AsyncStorage has
// no native-linking footguns in this sandbox.
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

export async function enqueueReport(draft: ReportDraft): Promise<void> {
  const queue = await loadQueue();
  queue.push(draft);
  await saveQueue(queue);
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
        return { ...draft, lastRejectionReason: result.rejectionReason ?? 'Rejected by server' };
      }
      return draft;
    });

  await saveQueue(remaining);
  return remaining;
}
