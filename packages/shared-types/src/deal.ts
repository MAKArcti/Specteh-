import { DealStatus } from './enums';

export interface Deal {
  id: string;
  requestId: string;
  equipmentId: string;
  customerId: string;
  operatorId: string;
  status: DealStatus;
  agreedPricePerHour: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmDealDto {
  matchOfferId: string;
}
