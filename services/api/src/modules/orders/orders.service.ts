import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DomainEvent, EquipmentStatus, OrderStatus, UserRole } from '@spectech/shared-types';
import { IsNull, Repository } from 'typeorm';
import { ChatService } from '../chat/chat.service';
import { EquipmentService } from '../equipment/equipment.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { AssignOrderDto } from './dto/assign-order.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderEntity } from './order.entity';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(OrderEntity)
    private readonly ordersRepository: Repository<OrderEntity>,
    private readonly equipmentService: EquipmentService,
    private readonly usersService: UsersService,
    private readonly chatService: ChatService,
    private readonly notificationsService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(renterId: string, dto: CreateOrderDto): Promise<OrderEntity> {
    let ownerId: string | undefined;
    if (dto.equipmentId) {
      const equipment = await this.equipmentService.findById(dto.equipmentId);
      if (!equipment || equipment.status !== EquipmentStatus.AVAILABLE) {
        throw new BadRequestException('Equipment is no longer available');
      }
      ownerId = equipment.ownerId;
    }

    const order = this.ordersRepository.create({
      renterId,
      equipmentType: dto.equipmentType,
      equipmentId: dto.equipmentId,
      ownerId,
      location: dto.location,
      dateFrom: dto.dateFrom,
      dateTo: dto.dateTo,
      comment: dto.comment,
      status: OrderStatus.REQUEST,
    });
    const saved = await this.ordersRepository.save(order);

    await this.eventEmitter.emitAsync(DomainEvent.ORDER_CREATED, { orderId: saved.id });
    return saved;
  }

  findById(id: string): Promise<OrderEntity | null> {
    return this.ordersRepository.findOneBy({ id });
  }

  async findByIdOrThrow(id: string): Promise<OrderEntity> {
    const order = await this.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  findForRenter(renterId: string): Promise<OrderEntity[]> {
    return this.ordersRepository.find({ where: { renterId }, order: { createdAt: 'DESC' } });
  }

  findForOperator(operatorId: string): Promise<OrderEntity[]> {
    return this.ordersRepository.find({ where: { operatorId }, order: { createdAt: 'DESC' } });
  }

  /** Owner's "Потребують дій": open marketplace requests plus their own claimed ones. */
  findActionableForOwner(ownerId: string): Promise<OrderEntity[]> {
    return this.ordersRepository.find({
      where: [
        { status: OrderStatus.REQUEST, ownerId: IsNull() },
        { status: OrderStatus.REQUEST, ownerId },
        { status: OrderStatus.AGREED, ownerId },
      ],
      order: { createdAt: 'DESC' },
    });
  }

  /** Whether `userId` may see this order: its renter, its owner, or its operator. */
  canView(order: OrderEntity, userId: string): boolean {
    return order.renterId === userId || order.ownerId === userId || order.operatorId === userId;
  }

  async assign(orderId: string, actingOwnerId: string, dto: AssignOrderDto): Promise<OrderEntity> {
    const order = await this.findByIdOrThrow(orderId);
    if (order.status !== OrderStatus.REQUEST) {
      throw new BadRequestException('Order is not awaiting assignment');
    }

    const equipment = await this.equipmentService.findById(dto.equipmentId);
    if (!equipment || equipment.status !== EquipmentStatus.AVAILABLE) {
      throw new BadRequestException('Equipment is no longer available');
    }
    if (equipment.ownerId !== actingOwnerId) {
      throw new ForbiddenException('You can only assign your own equipment');
    }

    const operator = await this.usersService.findById(dto.operatorId);
    if (!operator || !operator.roles.includes(UserRole.OPERATOR)) {
      throw new BadRequestException('Selected user is not an operator');
    }

    order.equipmentId = equipment.id;
    order.operatorId = operator.id;
    order.ownerId = equipment.ownerId;
    order.status = OrderStatus.AGREED;
    const saved = await this.ordersRepository.save(order);

    await this.equipmentService.setStatus(equipment.id, EquipmentStatus.BOOKED);
    await this.chatService.postSystemMessage(orderId, `Призначено оператора: ${operator.fullName}`);
    await this.notificationsService.notify(
      order.renterId,
      `Вам призначено техніку та оператора на замовлення`,
    );
    await this.notificationsService.notify(order.operatorId, `Вам призначено нове замовлення`);
    await this.eventEmitter.emitAsync(DomainEvent.ORDER_ASSIGNED, { orderId });
    return saved;
  }

  async startContract(orderId: string, actingOwnerId: string): Promise<OrderEntity> {
    const order = await this.findByIdOrThrow(orderId);
    if (order.status !== OrderStatus.AGREED) {
      throw new BadRequestException('Order is not agreed yet');
    }
    if (order.ownerId !== actingOwnerId) {
      throw new ForbiddenException('You can only start contracts for your own equipment');
    }

    const busy = await this.ordersRepository.findOneBy({
      operatorId: order.operatorId,
      status: OrderStatus.IN_WORK,
    });
    if (busy) {
      throw new ConflictException('This operator is already active on another order');
    }

    order.status = OrderStatus.IN_WORK;
    const saved = await this.ordersRepository.save(order);

    await this.equipmentService.setStatus(order.equipmentId as string, EquipmentStatus.WORKING);
    await this.chatService.postSystemMessage(orderId, 'Оператора додано до чату');
    await this.chatService.postSystemMessage(orderId, 'Роботи розпочато');
    await this.notificationsService.notify(order.renterId, 'Роботи по вашому замовленню розпочато');
    await this.eventEmitter.emitAsync(DomainEvent.ORDER_STARTED, { orderId });
    return saved;
  }

  /** Called by the reports module once the owner confirms the operator's report. */
  async completeFromReport(orderId: string): Promise<void> {
    const order = await this.findByIdOrThrow(orderId);
    if (order.status !== OrderStatus.IN_WORK) return;

    order.status = OrderStatus.DONE;
    await this.ordersRepository.save(order);
    if (order.equipmentId) {
      await this.equipmentService.setStatus(order.equipmentId, EquipmentStatus.AVAILABLE);
    }
    await this.chatService.postSystemMessage(orderId, 'Роботи завершено');
    await this.notificationsService.notify(order.renterId, 'Ваше замовлення завершено');
    await this.eventEmitter.emitAsync(DomainEvent.ORDER_DONE, { orderId });
  }

  async cancel(orderId: string, actingUserId: string): Promise<OrderEntity> {
    const order = await this.findByIdOrThrow(orderId);
    if (order.renterId !== actingUserId && order.ownerId !== actingUserId) {
      throw new ForbiddenException('Not your order');
    }
    if (order.status === OrderStatus.DONE || order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Order already closed');
    }

    order.status = OrderStatus.CANCELLED;
    const saved = await this.ordersRepository.save(order);
    if (order.equipmentId) {
      await this.equipmentService.setStatus(order.equipmentId, EquipmentStatus.AVAILABLE);
    }
    return saved;
  }
}
