import type { ReportDraft, ReportSyncItemResult } from '@spectech/shared-types';
import { apiRequest } from './client';

// The shared `ReportDraft` type nests `gps: { lat, lng }`, but the backend's
// ReportDraftDto (services/api/src/modules/reports/dto/report-draft.dto.ts)
// validates flat `lat`/`lng` fields instead. This is the exact shape the wire
// request needs; `toWireReportDraft` below bridges the two.
interface WireReportDraft {
  clientReportId: string;
  dealId: string;
  capturedAt: string;
  lat: number;
  lng: number;
  photoUrls: string[];
  workVolume: ReportDraft['workVolume'];
  engineHours?: number;
  notes?: string;
}

interface ReportSyncBatchResponse {
  results: ReportSyncItemResult[];
}

function toWireReportDraft(draft: ReportDraft): WireReportDraft {
  return {
    clientReportId: draft.clientReportId,
    dealId: draft.dealId,
    capturedAt: draft.capturedAt,
    lat: draft.gps.lat,
    lng: draft.gps.lng,
    photoUrls: draft.photoUrls,
    workVolume: draft.workVolume,
    engineHours: draft.engineHours,
    notes: draft.notes,
  };
}

export async function syncReportBatch(
  token: string,
  reports: ReportDraft[],
): Promise<ReportSyncItemResult[]> {
  const response = await apiRequest<ReportSyncBatchResponse>('/reports/sync', {
    method: 'POST',
    token,
    body: { reports: reports.map(toWireReportDraft) },
  });
  return response.results;
}
