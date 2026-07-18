import type { ConfirmDealDto, Deal } from '@spectech/shared-types';
import { api } from './client';

export function confirmDeal(payload: ConfirmDealDto) {
  return api.post<Deal>('/deals', payload);
}

export function getMyDeals() {
  return api.get<Deal[]>('/deals/mine');
}
