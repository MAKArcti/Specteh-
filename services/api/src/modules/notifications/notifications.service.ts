import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from './notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notificationsRepository: Repository<NotificationEntity>,
  ) {}

  notify(userId: string | undefined, text: string): Promise<NotificationEntity | undefined> {
    if (!userId) return Promise.resolve(undefined);
    return this.notificationsRepository.save(
      this.notificationsRepository.create({ userId, text }),
    );
  }

  findForUser(userId: string): Promise<NotificationEntity[]> {
    return this.notificationsRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.notificationsRepository.update({ userId, read: false }, { read: true });
  }
}
