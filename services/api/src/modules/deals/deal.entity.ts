import { DealStatus } from '@spectech/shared-types';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('deals')
export class DealEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  requestId: string;

  @Index()
  @Column()
  equipmentId: string;

  @Index()
  @Column()
  customerId: string;

  @Index()
  @Column()
  operatorId: string;

  @Column({ type: 'enum', enum: DealStatus, default: DealStatus.PENDING_CONFIRMATION })
  status: DealStatus;

  @Column({ type: 'float' })
  agreedPricePerHour: number;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
