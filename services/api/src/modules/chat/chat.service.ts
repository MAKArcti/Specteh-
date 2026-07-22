import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessageEntity } from './chat-message.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessageEntity)
    private readonly messagesRepository: Repository<ChatMessageEntity>,
  ) {}

  postSystemMessage(orderId: string, text: string): Promise<ChatMessageEntity> {
    return this.messagesRepository.save(
      this.messagesRepository.create({ orderId, isSystem: true, text }),
    );
  }

  postUserMessage(orderId: string, senderId: string, text: string): Promise<ChatMessageEntity> {
    return this.messagesRepository.save(
      this.messagesRepository.create({ orderId, senderId, isSystem: false, text }),
    );
  }

  findMessages(orderId: string): Promise<ChatMessageEntity[]> {
    return this.messagesRepository.find({ where: { orderId }, order: { createdAt: 'ASC' } });
  }
}
