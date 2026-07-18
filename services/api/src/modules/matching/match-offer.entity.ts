import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('match_offers')
export class MatchOfferEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  requestId: string;

  @Index()
  @Column()
  equipmentId: string;

  @Column({ type: 'float' })
  distanceKm: number;

  @Column({ type: 'float' })
  priceEstimate: number;

  @Column({ type: 'float' })
  score: number;

  @Column({ type: 'int' })
  rank: number;

  @CreateDateColumn()
  createdAt: Date;
}
