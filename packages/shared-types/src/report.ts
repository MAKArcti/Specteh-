import { ReportSyncStatus, WorkVolumeUnit } from './enums';
import { GeoPoint } from './geo';

export interface WorkVolume {
  value: number;
  unit: WorkVolumeUnit;
}

/**
 * A daily operator report as persisted server-side, after ingestion.
 * `capturedAt` is the device clock at creation time and is the field used for
 * ordering/validation — it can be far earlier than `receivedAt` when the
 * operator was offline (see offline-first principle in the ingestion pipeline).
 */
export interface Report {
  id: string;
  clientReportId: string;
  dealId: string;
  operatorId: string;
  capturedAt: string;
  receivedAt: string;
  gps: GeoPoint;
  photoUrls: string[];
  workVolume: WorkVolume;
  engineHours?: number;
  notes?: string;
  syncStatus: ReportSyncStatus;
}

/**
 * What the mobile app queues locally (SQLite) while offline and later ships
 * in a ReportSyncBatchRequest. `clientReportId` is a client-generated UUID
 * used as the idempotency key end-to-end, since connectivity gaps mean the
 * same batch may be retried more than once.
 */
export interface ReportDraft {
  clientReportId: string;
  dealId: string;
  capturedAt: string;
  gps: GeoPoint;
  photoUrls: string[];
  workVolume: WorkVolume;
  engineHours?: number;
  notes?: string;
}

export interface ReportSyncBatchRequest {
  reports: ReportDraft[];
}

export interface ReportSyncItemResult {
  clientReportId: string;
  accepted: boolean;
  reportId?: string;
  rejectionReason?: string;
}

export interface ReportSyncBatchResponse {
  results: ReportSyncItemResult[];
}
