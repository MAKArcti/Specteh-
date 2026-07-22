import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessageEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  orderId: string;

  @Column({ nullable: true })
  senderId?: string;

  @Column({ default: false })
  isSystem: boolean;

  @Column()
  text: string;

  @CreateDateColumn()
  createdAt: Date;
}
