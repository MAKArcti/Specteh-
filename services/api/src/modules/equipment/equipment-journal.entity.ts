import { JournalEntryKind } from '@spectech/shared-types';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

/** Single event stream per equipment (SoW 4.3): service/oil/repair/breakdown/work entries. */
@Entity('equipment_journal')
export class EquipmentJournalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  equipmentId: string;

  @Column({ type: 'enum', enum: JournalEntryKind })
  kind: JournalEntryKind;

  @Column()
  authorId: string;

  @Column()
  authorLabel: string;

  @Column()
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}
