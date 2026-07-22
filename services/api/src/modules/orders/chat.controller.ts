import { Body, Controller, ForbiddenException, Get, Param, Post, UseGuards } from '@nestjs/common';
import { OrderStatus } from '@spectech/shared-types';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/types/authenticated-user';
import { ChatService } from '../chat/chat.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { OrdersService } from './orders.service';

/**
 * Declared in OrdersModule (not ChatModule) so it can use OrdersService for
 * access checks without ChatModule needing to depend on Orders — keeps the
 * event-bus-style module boundary one-directional.
 */
@Controller('orders/:orderId/messages')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly chatService: ChatService,
  ) {}

  @Get()
  async findMessages(@CurrentUser() user: AuthenticatedUser, @Param('orderId') orderId: string) {
    const order = await this.ordersService.findByIdOrThrow(orderId);
    this.assertCanChat(order, user.id);
    return this.chatService.findMessages(orderId);
  }

  @Post()
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('orderId') orderId: string,
    @Body() dto: SendChatMessageDto,
  ) {
    const order = await this.ordersService.findByIdOrThrow(orderId);
    this.assertCanChat(order, user.id);
    return this.chatService.postUserMessage(orderId, user.id, dto.text);
  }

  /** Renter/owner always; the operator only joins once the contract is IN_WORK (SoW 6). */
  private assertCanChat(order: Awaited<ReturnType<OrdersService['findByIdOrThrow']>>, userId: string) {
    const isRenterOrOwner = order.renterId === userId || order.ownerId === userId;
    const isJoinedOperator =
      order.operatorId === userId &&
      (order.status === OrderStatus.IN_WORK || order.status === OrderStatus.DONE);
    if (!isRenterOrOwner && !isJoinedOperator) {
      throw new ForbiddenException('Not part of this order chat');
    }
  }
}
