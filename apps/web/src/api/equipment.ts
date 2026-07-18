import type { Equipment, EquipmentType } from '@spectech/shared-types';
import { api } from './client';

/**
 * There is no equipment list/GET endpoint yet, so the web app never fetches
 * equipment directly — owners only ever create records, and discovery
 * happens implicitly through the matching engine on the customer side.
 */
export interface CreateEquipmentPayload {
  type: EquipmentType;
  label: string;
  pricePerHour: number;
  lat: number;
  lng: number;
}

export function createEquipment(payload: CreateEquipmentPayload) {
  return api.post<Equipment>('/equipment', payload);
}
