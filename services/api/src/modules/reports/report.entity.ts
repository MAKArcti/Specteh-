import { GeoPoint, ReportSyncStatus, WorkVolume } from '@spectech/shared-types';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { geoPointTransformer } from '../../common/geo/geo-point.transformer';

@Entity('reports')
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Client-generated UUID from the mobile offline queue. Unique so that a
   * retried sync batch (same report shipped twice after a dropped connection)
   * is a no-op rather than a duplicate report — see ReportsSyncService.
   */
  @Index({ unique: true })
  @Column()
  clientReportId: string;

  @Index()
  @Column()
  dealId: string;

  @Index()
  @Column()
  operatorId: string;

  @Column({ type: 'timestamptz' })
  capturedAt: Date;

  @CreateDateColumn()
  receivedAt: Date;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: geoPointTransformer,
  })
  gps: GeoPoint;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  photoUrls: string[];

  @Column({ type: 'jsonb' })
  workVolume: WorkVolume;

  @Column({ type: 'float', nullable: true })
  engineHours?: number;

  @Column({ nullable: true })
  notes?: string;

  @Column({ type: 'enum', enum: ReportSyncStatus, default: ReportSyncStatus.QUEUED })
  syncStatus: ReportSyncStatus;

  @Column({ nullable: true })
  rejectionReason?: string;
}
