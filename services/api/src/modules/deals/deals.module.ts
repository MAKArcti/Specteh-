import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentModule } from '../equipment/equipment.module';
import { MatchingModule } from '../matching/matching.module';
import { RequestsModule } from '../requests/requests.module';
import { DealEntity } from './deal.entity';
import { DealsController } from './deals.controller';
import { DealsService } from './deals.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DealEntity]),
    MatchingModule,
    RequestsModule,
    EquipmentModule,
  ],
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
