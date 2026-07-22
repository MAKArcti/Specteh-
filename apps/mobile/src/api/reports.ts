import type {
  Report,
  ReportDraft,
  ReportSyncBatchResponse,
  ReportSyncItemResult,
} from '@spectech/shared-types';
import { api } from './client';

/**
 * The shared `ReportDraft` interface nests `gps: { lat, lng }`, but the
 * backend's ReportDraftDto (services/api/src/modules/reports/dto/report-draft.dto.ts)
 * validates flat `lat`/`lng` fields instead (class-validator decorates
 * primitives directly) — same established wrinkle as apps/web's request
 * flow (see repo root CLAUDE.md). Everything else on the draft, including
 * `photos`, stays nested since the DTO validates it with `@ValidateNested`.
 * The persisted/queued shape stays the nested `ReportDraft`; only this call
 * boundary flattens it.
 */
interface WireReportDraft {
  clientReportId: string;
  orderId: string;
  capturedAt: string;
  startedAt?: string;
  endedAt?: string;
  durationMin?: number;
  text: string;
  lat: number;
  lng: number;
  photos: ReportDraft['photos'];
  engineHours?: number;
  fuelConsumption?: string;
  problem: boolean;
  needsService: boolean;
}

function toWireReportDraft(draft: ReportDraft): WireReportDraft {
  const { gps, ...rest } = draft;
  return { ...rest, lat: gps.lat, lng: gps.lng };
}

export async function syncReportBatch(reports: ReportDraft[]): Promise<ReportSyncItemResult[]> {
  const response = await api.post<ReportSyncBatchResponse>('/reports/sync', {
    reports: reports.map(toWireReportDraft),
  });
  return response.results;
}

export function getReportsForOrder(orderId: string) {
  return api.get<Report[]>(`/orders/${orderId}/reports`);
}

export function confirmReport(id: string) {
  return api.post<Report>(`/reports/${id}/confirm`);
}
