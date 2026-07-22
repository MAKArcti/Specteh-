import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/configuration';
import { ChatMessageEntity } from '../modules/chat/chat-message.entity';
import { DealEntity } from '../modules/deals/deal.entity';
import { EquipmentJournalEntity } from '../modules/equipment/equipment-journal.entity';
import { EquipmentOperatorEntity } from '../modules/equipment/equipment-operator.entity';
import { EquipmentEntity } from '../modules/equipment/equipment.entity';
import { MatchOfferEntity } from '../modules/matching/match-offer.entity';
import { NotificationEntity } from '../modules/notifications/notification.entity';
import { OrderEntity } from '../modules/orders/order.entity';
import { ReportEntity } from '../modules/reports/report.entity';
import { EquipmentRequestEntity } from '../modules/requests/equipment-request.entity';
import { UserEntity } from '../modules/users/user.entity';

export const entities = [
  UserEntity,
  EquipmentEntity,
  EquipmentOperatorEntity,
  EquipmentJournalEntity,
  EquipmentRequestEntity,
  MatchOfferEntity,
  DealEntity,
  OrderEntity,
  ChatMessageEntity,
  NotificationEntity,
  ReportEntity,
];

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) => ({
        type: 'postgres',
        host: config.get('database.host', { infer: true }),
        port: config.get('database.port', { infer: true }),
        username: config.get('database.username', { infer: true }),
        password: config.get('database.password', { infer: true }),
        database: config.get('database.name', { infer: true }),
        entities,
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: false,
        synchronize: false,
      }),
    }),
  ],
})
export class DatabaseModule {}
