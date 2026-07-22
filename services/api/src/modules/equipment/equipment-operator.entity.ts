import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Many-to-many "closed to" assignment: an operator can be linked to several machines. */
@Entity('equipment_operators')
@Index(['equipmentId', 'operatorId'], { unique: true })
export class EquipmentOperatorEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  equipmentId: string;

  @Index()
  @Column()
  operatorId: string;

  @CreateDateColumn()
  createdAt: Date;
}
