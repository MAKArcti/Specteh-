import { EquipmentType, OrderStatus } from './enums';

/**
 * "Замовлення" per SoW section 5: created directly by the renter (no
 * matching-engine ranking step — see CLAUDE.md for why this coexists with
 * the older Request/MatchOffer/Deal flow used by apps/web). `equipmentId`
 * and `operatorId` are filled in later by the owner's manual assign action.
 */
export interface Order {
  id: string;
  renterId: string;
  equipmentType: EquipmentType;
  equipmentId?: string;
  operatorId?: string;
  ownerId?: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  comment?: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderDto {
  equipmentType: EquipmentType;
  equipmentId?: string;
  location: string;
  dateFrom: string;
  dateTo: string;
  comment?: string;
}

export interface AssignOrderDto {
  equipmentId: string;
  operatorId: string;
}
