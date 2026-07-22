import { useCallback, useEffect, useState } from 'react';
import type { ReportDraft } from '@spectech/shared-types';
import { syncReportBatch } from '@/api/reports';
import { enqueueReport, loadQueue, reconcileQueue, type QueuedReportDraft } from '@/storage/reportQueue';

export function useReportQueue() {
  const [queue, setQueue] = useState<QueuedReportDraft[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setQueue(await loadQueue());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const enqueue = useCallback(
    async (draft: ReportDraft) => {
      await enqueueReport(draft);
      await refresh();
    },
    [refresh],
  );

  const sync = useCallback(async () => {
    const pending = await loadQueue();
    if (pending.length === 0) {
      setSyncError(null);
      return;
    }
    setIsSyncing(true);
    setSyncError(null);
    try {
      const results = await syncReportBatch(pending);
      const remaining = await reconcileQueue(results);
      setQueue(remaining);
    } catch (error) {
      // A failed batch request (e.g. no connectivity) leaves the queue
      // untouched on disk — nothing is lost, the operator just retries later.
      setSyncError(error instanceof Error ? error.message : 'Синхронізація не вдалась');
    } finally {
      setIsSyncing(false);
    }
  }, []);

  return { queue, isSyncing, syncError, enqueue, sync, refresh };
}
