import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EquipmentJournalEntity } from './equipment-journal.entity';
import { EquipmentOperatorEntity } from './equipment-operator.entity';
import { EquipmentEntity } from './equipment.entity';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EquipmentEntity, EquipmentOperatorEntity, EquipmentJournalEntity]),
  ],
  controllers: [EquipmentController],
  providers: [EquipmentService],
  exports: [EquipmentService],
})
export class EquipmentModule {}
