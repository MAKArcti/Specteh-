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
   * a client-generated `clientReportId`. Replaying an already-synced batch is
   * a no-op; resubmitting the same id for a report that isn't confirmed yet
   * is treated as an edit (SoW 7: "Оператор створює та редагує до
   * підтвердження") and updates the row in place instead of rejecting it.
   */
  async syncBatch(operatorId: string, drafts: ReportDraftDto[]): Promise<ReportSyncItemResult[]> {
    const results: ReportSyncItemResult[] = [];

    for (const draft of drafts) {
      const existing = await this.reportsRepository.findOneBy({
        clientReportId: draft.clientReportId,
      });

      if (existing?.confirmed) {
        results.push({
          clientReportId: draft.clientReportId,
          accepted: true,
          reportId: existing.id,
        });
        continue;
      }

      const rejectionReason = this.validateDraft(draft);
      if (rejectionReason) {
        results.push({ clientReportId: draft.clientReportId, accepted: false, rejectionReason });
        continue;
      }

      const fields = {
        orderId: draft.orderId,
        operatorId,
        capturedAt: new Date(draft.capturedAt),
        startedAt: draft.startedAt ? new Date(draft.startedAt) : undefined,
        endedAt: draft.endedAt ? new Date(draft.endedAt) : undefined,
        durationMin: draft.durationMin,
        text: draft.text,
        gps: { lat: draft.lat, lng: draft.lng },
        photos: draft.photos,
        engineHours: draft.engineHours,
        fuelConsumption: draft.fuelConsumption,
        problem: draft.problem,
        needsService: draft.needsService,
        syncStatus: ReportSyncStatus.QUEUED,
      };

      const report = existing
        ? await this.reportsRepository.save({ ...existing, ...fields })
        : await this.reportsRepository.save(
            this.reportsRepository.create({ clientReportId: draft.clientReportId, ...fields }),
          );

      await this.ingestionQueue.add('ingest-report', { reportId: report.id });
      results.push({ clientReportId: draft.clientReportId, accepted: true, reportId: report.id });
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
