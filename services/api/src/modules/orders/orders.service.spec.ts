import { BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { EquipmentStatus, OrderStatus, UserRole } from '@spectech/shared-types';
import { OrdersService } from './orders.service';

function buildDeps() {
  const ordersRepository = {
    create: jest.fn((data) => data),
    save: jest.fn(async (data) => ({ id: 'order-1', ...data })),
    findOneBy: jest.fn(),
    find: jest.fn(),
  };
  const equipmentService = { findById: jest.fn(), setStatus: jest.fn() };
  const usersService = { findById: jest.fn() };
  const chatService = { postSystemMessage: jest.fn() };
  const notificationsService = { notify: jest.fn() };
  const eventEmitter = { emitAsync: jest.fn() };
  const service = new OrdersService(
    ordersRepository as never,
    equipmentService as never,
    usersService as never,
    chatService as never,
    notificationsService as never,
    eventEmitter as never,
  );
  return { service, ordersRepository, equipmentService, usersService, chatService, notificationsService };
}

const baseOrder = {
  id: 'order-1',
  renterId: 'renter-1',
  status: OrderStatus.REQUEST,
  equipmentId: undefined,
  operatorId: undefined,
  ownerId: undefined,
};

describe('OrdersService business rules', () => {
  it('assign rejects equipment that is not AVAILABLE (double-booking guard)', async () => {
    const { service, ordersRepository, equipmentService } = buildDeps();
    ordersRepository.findOneBy.mockResolvedValue({ ...baseOrder });
    equipmentService.findById.mockResolvedValue({ id: 'eq-1', ownerId: 'owner-1', status: EquipmentStatus.BOOKED });

    await expect(
      service.assign('order-1', 'owner-1', { equipmentId: 'eq-1', operatorId: 'op-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('assign rejects an owner assigning equipment they do not own', async () => {
    const { service, ordersRepository, equipmentService } = buildDeps();
    ordersRepository.findOneBy.mockResolvedValue({ ...baseOrder });
    equipmentService.findById.mockResolvedValue({ id: 'eq-1', ownerId: 'someone-else', status: EquipmentStatus.AVAILABLE });

    await expect(
      service.assign('order-1', 'owner-1', { equipmentId: 'eq-1', operatorId: 'op-1' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('startContract rejects an operator already IN_WORK on another order', async () => {
    const { service, ordersRepository } = buildDeps();
    ordersRepository.findOneBy
      .mockResolvedValueOnce({
        ...baseOrder,
        status: OrderStatus.AGREED,
        ownerId: 'owner-1',
        operatorId: 'op-1',
        equipmentId: 'eq-1',
      })
      .mockResolvedValueOnce({ id: 'order-2', operatorId: 'op-1', status: OrderStatus.IN_WORK });

    await expect(service.startContract('order-1', 'owner-1')).rejects.toBeInstanceOf(ConflictException);
  });

  it('startContract succeeds when the operator is free and marks equipment WORKING', async () => {
    const { service, ordersRepository, equipmentService } = buildDeps();
    ordersRepository.findOneBy
      .mockResolvedValueOnce({
        ...baseOrder,
        status: OrderStatus.AGREED,
        ownerId: 'owner-1',
        operatorId: 'op-1',
        equipmentId: 'eq-1',
      })
      .mockResolvedValueOnce(null);

    await service.startContract('order-1', 'owner-1');

    expect(equipmentService.setStatus).toHaveBeenCalledWith('eq-1', EquipmentStatus.WORKING);
  });

  it('assign rejects a selected user without the OPERATOR role', async () => {
    const { service, ordersRepository, equipmentService, usersService } = buildDeps();
    ordersRepository.findOneBy.mockResolvedValue({ ...baseOrder });
    equipmentService.findById.mockResolvedValue({ id: 'eq-1', ownerId: 'owner-1', status: EquipmentStatus.AVAILABLE });
    usersService.findById.mockResolvedValue({ id: 'op-1', roles: [UserRole.CUSTOMER] });

    await expect(
      service.assign('order-1', 'owner-1', { equipmentId: 'eq-1', operatorId: 'op-1' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
