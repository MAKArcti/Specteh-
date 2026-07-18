import { EquipmentStatus, EquipmentType } from './enums';
import { GeoPoint } from './geo';

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
}
