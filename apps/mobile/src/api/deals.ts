import type { Deal } from '@spectech/shared-types';
import { apiRequest } from './client';

export async function fetchMyDeals(token: string): Promise<Deal[]> {
  return apiRequest<Deal[]>('/deals/mine', { token });
}
