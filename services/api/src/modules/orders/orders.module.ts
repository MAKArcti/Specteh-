import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatModule } from '../chat/chat.module';
import { EquipmentModule } from '../equipment/equipment.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { ChatController } from './chat.controller';
import { OrderEntity } from './order.entity';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderEntity]),
    EquipmentModule,
    UsersModule,
    ChatModule,
    NotificationsModule,
  ],
  controllers: [OrdersController, ChatController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
