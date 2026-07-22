import { EquipmentStatus, EquipmentType } from './enums';
import { GeoPoint } from './geo';

/**
 * The "техпаспорт" (electronic passport, SoW 4.2) fields are optional
 * because equipment created through the legacy web create-listing flow
 * (apps/web, unchanged) only ever sends type/label/price/location — the
 * richer passport data is populated by the mobile "Додати техніку" flow.
 */
export interface Equipment {
  id: string;
  ownerId: string;
  type: EquipmentType;
  label: string;
  pricePerHour: number;
  location: GeoPoint;
  status: EquipmentStatus;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
  brand?: string;
  model?: string;
  serialNumber?: string;
  photoUrl?: string;
  engineHours?: number;
  fuelConsumption?: string;
  oilStatus?: string;
  mass?: string;
  capacity?: string;
  conditions?: string;
  assignedOperatorIds: string[];
}

export interface CreateEquipmentDto {
  type: EquipmentType;
  label: string;
  pricePerHour: number;
  lat: number;
  lng: number;
  brand?: string;
  model?: string;
  serialNumber?: string;
  photoUrl?: string;
  mass?: string;
  capacity?: string;
  conditions?: string;
  operatorId?: string;
}

export interface AssignOperatorDto {
  operatorId: string;
}
