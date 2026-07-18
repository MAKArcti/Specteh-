import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealsModule } from '../deals/deals.module';
import { ReportEntity } from './report.entity';
import { ReportsController } from './reports.controller';
import { ReportsIngestionProcessor } from './reports-ingestion.processor';
import { REPORT_INGESTION_QUEUE, ReportsSyncService } from './reports-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ReportEntity]),
    BullModule.registerQueue({ name: REPORT_INGESTION_QUEUE }),
    DealsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsSyncService, ReportsIngestionProcessor],
})
export class ReportsModule {}
