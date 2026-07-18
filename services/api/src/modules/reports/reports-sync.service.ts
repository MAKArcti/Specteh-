import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ReportSyncStatus } from '@spectech/shared-types';
import { Queue } from 'bullmq';
import { Repository } from 'typeorm';
import { ReportDraftDto } from './dto/report-draft.dto';
import { ReportEntity } from './report.entity';

export interface ReportSyncItemResult {
  clientReportId: string;
  accepted: boolean;
  reportId?: string;
  rejectionReason?: string;
}

export const REPORT_INGESTION_QUEUE = 'report-ingestion';

/** Clock-skew tolerance for a report claiming to be captured "in the future". */
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;

@Injectable()
export class ReportsSyncService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportsRepository: Repository<ReportEntity>,
    @InjectQueue(REPORT_INGESTION_QUEUE)
    private readonly ingestionQueue: Queue,
  ) {}

  /**
   * Idempotent batch intake for the mobile offline queue: each draft carries
   * a client-generated `clientReportId`, so replaying an already-synced batch
   * (e.g. after a dropped connection ack) is safe and just echoes the prior
   * result instead of creating a duplicate report.
   */
  async syncBatch(operatorId: string, drafts: ReportDraftDto[]): Promise<ReportSyncItemResult[]> {
    const results: ReportSyncItemResult[] = [];

    for (const draft of drafts) {
      const existing = await this.reportsRepository.findOneBy({
        clientReportId: draft.clientReportId,
      });
      if (existing) {
        results.push({
          clientReportId: draft.clientReportId,
          accepted: existing.syncStatus !== ReportSyncStatus.REJECTED,
          reportId: existing.id,
          rejectionReason: existing.rejectionReason,
        });
        continue;
      }

      const rejectionReason = this.validateDraft(draft);
      if (rejectionReason) {
        results.push({ clientReportId: draft.clientReportId, accepted: false, rejectionReason });
        continue;
      }

      const report = this.reportsRepository.create({
        clientReportId: draft.clientReportId,
        dealId: draft.dealId,
        operatorId,
        capturedAt: new Date(draft.capturedAt),
        gps: { lat: draft.lat, lng: draft.lng },
        photoUrls: draft.photoUrls,
        workVolume: draft.workVolume,
        engineHours: draft.engineHours,
        notes: draft.notes,
        syncStatus: ReportSyncStatus.QUEUED,
      });
      const saved = await this.reportsRepository.save(report);
      await this.ingestionQueue.add('ingest-report', { reportId: saved.id });

      results.push({ clientReportId: draft.clientReportId, accepted: true, reportId: saved.id });
    }

    return results;
  }

  private validateDraft(draft: ReportDraftDto): string | undefined {
    const capturedAt = new Date(draft.capturedAt);
    if (Number.isNaN(capturedAt.getTime())) {
      return 'capturedAt is not a valid date';
    }
    if (capturedAt.getTime() - Date.now() > MAX_FUTURE_SKEW_MS) {
      return 'capturedAt is too far in the future';
    }
    return undefined;
  }
}
