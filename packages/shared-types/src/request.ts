import { EquipmentType, RequestStatus } from './enums';
import { GeoPoint } from './geo';

export interface EquipmentRequest {
  id: string;
  customerId: string;
  equipmentType: EquipmentType;
  location: GeoPoint;
  searchRadiusKm: number;
  startDate: string;
  endDate: string;
  status: RequestStatus;
  notes?: string;
  createdAt: string;
}

export interface CreateEquipmentRequestDto {
  equipmentType: EquipmentType;
  location: GeoPoint;
  searchRadiusKm: number;
  startDate: string;
  endDate: string;
  notes?: string;
}

/**
 * One ranked candidate produced by the matching engine for a request.
 * `score` is the weighted composite of distance, price, rating and availability
 * (see services/api/src/modules/matching/matching.service.ts for the formula).
 */
export interface MatchOffer {
  id: string;
  requestId: string;
  equipmentId: string;
  distanceKm: number;
  priceEstimate: number;
  score: number;
  rank: number;
  createdAt: string;
}
