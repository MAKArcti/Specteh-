import { EquipmentType, OrderStatus } from '@spectech/shared-types';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  renterId: string;

  @Column({ type: 'enum', enum: EquipmentType })
  equipmentType: EquipmentType;

  @Index()
  @Column({ nullable: true })
  equipmentId?: string;

  @Index()
  @Column({ nullable: true })
  operatorId?: string;

  /** Set once equipment is picked (at creation if the renter targeted a specific unit, or at assign time otherwise). */
  @Index()
  @Column({ nullable: true })
  ownerId?: string;

  @Column()
  location: string;

  @Column()
  dateFrom: string;

  @Column()
  dateTo: string;

  @Column({ nullable: true })
  comment?: string;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.REQUEST })
  status: OrderStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
