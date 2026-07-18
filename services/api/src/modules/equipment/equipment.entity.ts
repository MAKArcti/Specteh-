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

  @CreateDateColumn()
  createdAt: Date;
}
