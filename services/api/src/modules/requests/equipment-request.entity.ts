import { EquipmentType, GeoPoint, RequestStatus } from '@spectech/shared-types';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { geoPointTransformer } from '../../common/geo/geo-point.transformer';

@Entity('equipment_requests')
export class EquipmentRequestEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  customerId: string;

  @Column({ type: 'enum', enum: EquipmentType })
  equipmentType: EquipmentType;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: geoPointTransformer,
  })
  location: GeoPoint;

  @Column({ type: 'float' })
  searchRadiusKm: number;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.OPEN })
  status: RequestStatus;

  @Column({ nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;
}
