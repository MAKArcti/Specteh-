import { EquipmentStatus, EquipmentType, GeoPoint } from '@spectech/shared-types';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { geoPointTransformer } from '../../common/geo/geo-point.transformer';

@Entity('equipment')
export class EquipmentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  ownerId: string;

  @Column({ type: 'enum', enum: EquipmentType })
  type: EquipmentType;

  @Column()
  label: string;

  @Column({ type: 'float' })
  pricePerHour: number;

  @Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: geoPointTransformer,
  })
  location: GeoPoint;

  @Column({ type: 'enum', enum: EquipmentStatus, default: EquipmentStatus.AVAILABLE })
  status: EquipmentStatus;

  @Column({ type: 'float', default: 0 })
  ratingAvg: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  // "Електронний техпаспорт" fields (SoW 4.2) — nullable because the legacy
  // web create-listing flow doesn't populate them (see CreateEquipmentDto).
  @Column({ nullable: true })
  brand?: string;

  @Column({ nullable: true })
  model?: string;

  @Column({ nullable: true })
  serialNumber?: string;

  @Column({ nullable: true })
  photoUrl?: string;

  @Column({ type: 'float', nullable: true })
  engineHours?: number;

  @Column({ nullable: true })
  fuelConsumption?: string;

  @Column({ nullable: true })
  oilStatus?: string;

  @Column({ nullable: true })
  mass?: string;

  @Column({ nullable: true })
  capacity?: string;

  @Column({ nullable: true })
  conditions?: string;

  @CreateDateColumn()
  createdAt: Date;
}
