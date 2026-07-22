import { ReportSyncStatus } from './enums';
import { GeoPoint } from './geo';

export interface ReportPhotos {
  before?: string;
  during?: string;
  after?: string;
}

/**
 * A work report (SoW 7). `capturedAt` is the device clock at creation time —
 * it can be far earlier than `receivedAt` when the operator was offline (see
 * the offline-first ingestion pipeline). `confirmed` is the owner's business
 * sign-off (SoW: operator edits until confirmed, then it's locked), distinct
 * from `syncStatus` which is the offline-queue ingestion outcome.
 */
export interface Report {
  id: string;
  clientReportId: string;
  orderId: string;
  operatorId: string;
  capturedAt: string;
  receivedAt: string;
  startedAt?: string;
  endedAt?: string;
  durationMin?: number;
  text: string;
  gps: GeoPoint;
  photos: ReportPhotos;
  engineHours?: number;
  fuelConsumption?: string;
  problem: boolean;
  needsService: boolean;
  syncStatus: ReportSyncStatus;
  rejectionReason?: string;
  confirmed: boolean;
}

/**
 * What the mobile app queues locally while offline and later ships in a
 * ReportSyncBatchRequest. `clientReportId` is a client-generated UUID used
 * as the idempotency key end-to-end, since connectivity gaps mean the same
 * batch may be retried more than once.
 */
export interface ReportDraft {
  clientReportId: string;
  orderId: string;
  capturedAt: string;
  startedAt?: string;
  endedAt?: string;
  durationMin?: number;
  text: string;
  gps: GeoPoint;
  photos: ReportPhotos;
  engineHours?: number;
  fuelConsumption?: string;
  problem: boolean;
  needsService: boolean;
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
