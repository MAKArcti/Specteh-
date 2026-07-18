import { UserRole } from '@spectech/shared-types';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @Column()
  fullName: string;

  @Index({ unique: true })
  @Column()
  phone: string;

  @Column({ nullable: true })
  email?: string;

  @Column()
  passwordHash: string;

  @Column({ type: 'float', default: 0 })
  ratingAvg: number;

  @Column({ type: 'int', default: 0 })
  ratingCount: number;

  @CreateDateColumn()
  createdAt: Date;
}
