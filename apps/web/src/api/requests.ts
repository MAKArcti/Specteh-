import type { EquipmentRequest, EquipmentType, MatchOffer } from '@spectech/shared-types';
import { api } from './client';

/**
 * Shape here is the API's actual flat lat/lng body (see
 * services/api/src/modules/requests/dto/create-request.dto.ts), which is
 * NOT the same as the shared CreateEquipmentRequestDto interface (that one
 * nests a `location: GeoPoint` and would be rejected by the API's
 * whitelist validation).
 */
export interface CreateRequestPayload {
  equipmentType: EquipmentType;
  lat: number;
  lng: number;
  searchRadiusKm: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

export function createRequest(payload: CreateRequestPayload) {
  return api.post<EquipmentRequest>('/requests', payload);
}

export function getOffers(requestId: string) {
  return api.get<MatchOffer[]>(`/requests/${requestId}/offers`);
}
