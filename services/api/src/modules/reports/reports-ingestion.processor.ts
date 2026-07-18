import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DealStatus, DomainEvent, ReportSyncStatus } from '@spectech/shared-types';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { DealsService } from '../deals/deals.service';
import { REPORT_INGESTION_QUEUE } from './reports-sync.service';
import { ReportEntity } from './report.entity';

export interface ReportIngestedPayload {
  reportId: string;
  dealId: string;
}

interface IngestReportJobData {
  reportId: string;
}

/**
 * Ingestion pipeline step 3 ("Обробка" in the architecture deck): validates
 * a queued report against its claimed deal and geo-binds it, independent of
 * whether the operator was online when the report was captured.
 */
@Processor(REPORT_INGESTION_QUEUE)
export class ReportsIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportsIngestionProcessor.name);

  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportsRepository: Repository<ReportEntity>,
    private readonly dealsService: DealsService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    super();
  }

  async process(job: Job<IngestReportJobData>): Promise<void> {
    const report = await this.reportsRepository.findOneBy({ id: job.data.reportId });
    if (!report) {
      this.logger.warn(`Report ${job.data.reportId} disappeared before ingestion`);
      return;
    }

    const deal = await this.dealsService.findById(report.dealId);
    const rejectionReason = this.validateAgainstDeal(report, deal);

    if (rejectionReason) {
      await this.reportsRepository.update(
        { id: report.id },
        { syncStatus: ReportSyncStatus.REJECTED, rejectionReason },
      );
      return;
    }

    await this.reportsRepository.update(
      { id: report.id },
      { syncStatus: ReportSyncStatus.SYNCED },
    );

    await this.dealsService.advanceStatus(report.dealId, DealStatus.IN_PROGRESS);

    await this.eventEmitter.emitAsync(DomainEvent.REPORT_INGESTED, {
      reportId: report.id,
      dealId: report.dealId,
    } satisfies ReportIngestedPayload);
  }

  private validateAgainstDeal(
    report: ReportEntity,
    deal: Awaited<ReturnType<DealsService['findById']>>,
  ): string | undefined {
    if (!deal) return 'Report references a deal that does not exist';
    if (deal.operatorId !== report.operatorId) {
      return 'Reporting operator does not match the deal operator';
    }
    return undefined;
  }
}
