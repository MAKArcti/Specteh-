import { GeoPoint, ReportPhotos, ReportSyncStatus } from '@spectech/shared-types';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { geoPointTransformer } from '../../common/geo/geo-point.transformer';

@Entity('reports')
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Client-generated UUID from the mobile offline queue. Unique so that a
   * retried sync batch is a no-op, and so the operator can edit an
   * unconfirmed report by resubmitting the same id (see ReportsSyncService).
   */
  @Index({ unique: true })
  @Column()
  clientReportId: string;

  @Index()
  @Column()
  orderId: string;

  @Index()
  @Column()
  operatorId: string;

  @Column({ type: 'timestamptz' })
  capturedAt: Date;

  @CreateDateColumn()
  receivedAt: Date;

  @Column({ type: 'timestamptz', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  endedAt?: Date;

  @Column({ type: 'int', nullable: true })
  durationMin?: number;

  @Column({ type: 'text' })
  text: string;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: geoPointTransformer,
  })
  gps: GeoPoint;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  photos: ReportPhotos;

  @Column({ type: 'float', nullable: true })
  engineHours?: number;

  @Column({ nullable: true })
  fuelConsumption?: string;

  @Column({ default: false })
  problem: boolean;

  @Column({ default: false })
  needsService: boolean;

  @Column({ type: 'enum', enum: ReportSyncStatus, default: ReportSyncStatus.QUEUED })
  syncStatus: ReportSyncStatus;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ default: false })
  confirmed: boolean;
}
