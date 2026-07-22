import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, OrderStatus, ReportSyncStatus } from '@spectech/shared-types';
import { Job } from 'bullmq';
import { Repository } from 'typeorm';
import { NotificationsService } from '../notifications/notifications.service';
import { OrdersService } from '../orders/orders.service';
import { REPORT_INGESTION_QUEUE } from './reports-sync.service';
import { ReportEntity } from './report.entity';

interface IngestReportJobData {
  reportId: string;
}

/**
 * Ingestion pipeline step 3 ("Обробка" in the architecture deck): validates a
 * queued report against its claimed order and geo-binds it, independent of
 * whether the operator was online when the report was captured. Does not
 * itself flip the order to IN_WORK — the operator's explicit "start work"
 * action (OrdersService.startContract) already did that.
 */
@Processor(REPORT_INGESTION_QUEUE)
export class ReportsIngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportsIngestionProcessor.name);

  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportsRepository: Repository<ReportEntity>,
    private readonly ordersService: OrdersService,
    private readonly notificationsService: NotificationsService,
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

    const order = await this.ordersService.findById(report.orderId);
    const rejectionReason = this.validateAgainstOrder(report, order);

    if (rejectionReason) {
      await this.reportsRepository.update(
        { id: report.id },
        { syncStatus: ReportSyncStatus.REJECTED, rejectionReason },
      );
      return;
    }

    await this.reportsRepository.update(
      { id: report.id },
      { syncStatus: ReportSyncStatus.SYNCED, rejectionReason: undefined },
    );

    if (order) {
      await this.notificationsService.notify(order.ownerId, 'Новий звіт по роботі очікує підтвердження');
    }
    await this.eventEmitter.emitAsync(DomainEvent.ORDER_REPORT_SUBMITTED, {
      reportId: report.id,
      orderId: report.orderId,
    });
  }

  private validateAgainstOrder(
    report: ReportEntity,
    order: Awaited<ReturnType<OrdersService['findById']>>,
  ): string | undefined {
    if (!order) return 'Report references an order that does not exist';
    if (order.operatorId !== report.operatorId) {
      return 'Reporting operator does not match the order operator';
    }
    if (order.status !== OrderStatus.IN_WORK && order.status !== OrderStatus.DONE) {
      return 'Order is not in an active contract';
    }
    return undefined;
  }
}
