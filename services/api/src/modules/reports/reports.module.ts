import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsModule } from '../notifications/notifications.module';
import { OrdersModule } from '../orders/orders.module';
import { ReportEntity } from './report.entity';
import { ReportsController } from './reports.controller';
import { ReportsIngestionProcessor } from './reports-ingestion.processor';
import { REPORT_INGESTION_QUEUE, ReportsSyncService } from './reports-sync.service';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity]),
    BullModule.registerQueue({ name: REPORT_INGESTION_QUEUE }),
    OrdersModule,
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsSyncService, ReportsIngestionProcessor, ReportsService],
})
export class ReportsModule {}
