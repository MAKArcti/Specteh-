import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from '../config/configuration';
import { DealEntity } from '../modules/deals/deal.entity';
import { EquipmentEntity } from '../modules/equipment/equipment.entity';
import { MatchOfferEntity } from '../modules/matching/match-offer.entity';
import { ReportEntity } from '../modules/reports/report.entity';
import { EquipmentRequestEntity } from '../modules/requests/equipment-request.entity';
import { UserEntity } from '../modules/users/user.entity';

export const entities = [
  UserEntity,
  EquipmentEntity,
  EquipmentRequestEntity,
  MatchOfferEntity,
  DealEntity,
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
