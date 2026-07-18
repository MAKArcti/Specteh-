import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentModule } from '../equipment/equipment.module';
import { RequestsModule } from '../requests/requests.module';
import { MatchOfferEntity } from './match-offer.entity';
import { MatchingController } from './matching.controller';
import { MatchingListener } from './matching.listener';
import { MatchingService } from './matching.service';

@Module({
  imports: [TypeOrmModule.forFeature([MatchOfferEntity]), EquipmentModule, RequestsModule],
  controllers: [MatchingController],
  providers: [MatchingService, MatchingListener],
  exports: [MatchingService],
})
export class MatchingModule {}
