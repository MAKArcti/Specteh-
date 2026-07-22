import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent } from '@spectech/shared-types';
import { Repository } from 'typeorm';
import { OrdersService } from '../orders/orders.service';
import { ReportEntity } from './report.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportsRepository: Repository<ReportEntity>,
    private readonly ordersService: OrdersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  findByOrder(orderId: string): Promise<ReportEntity[]> {
    return this.reportsRepository.find({ where: { orderId }, order: { receivedAt: 'DESC' } });
  }

  /** SoW 7 rights: only the order's owner may confirm a report. */
  async confirm(reportId: string, actingOwnerId: string): Promise<ReportEntity> {
    const report = await this.reportsRepository.findOneBy({ id: reportId });
    if (!report) throw new NotFoundException('Report not found');
    if (report.confirmed) return report;

    const order = await this.ordersService.findByIdOrThrow(report.orderId);
    if (order.ownerId !== actingOwnerId) {
      throw new ForbiddenException('Only the equipment owner can confirm this report');
    }

    report.confirmed = true;
    const saved = await this.reportsRepository.save(report);
    await this.ordersService.completeFromReport(order.id);
    await this.eventEmitter.emitAsync(DomainEvent.ORDER_REPORT_CONFIRMED, {
      reportId: report.id,
      orderId: order.id,
    });
    return saved;
  }
}
