import type {
  CreateEquipmentDto,
  Equipment,
  EquipmentJournalEntry,
  EquipmentType,
  JournalEntryKind,
} from '@spectech/shared-types';
import { api } from './client';

export function createEquipment(dto: CreateEquipmentDto) {
  return api.post<Equipment>('/equipment', dto);
}

export function getBrowsableEquipment(type?: EquipmentType) {
  const query = type ? `?type=${encodeURIComponent(type)}` : '';
  return api.get<Equipment[]>(`/equipment${query}`);
}

export function getMyEquipment() {
  return api.get<Equipment[]>('/equipment/mine');
}

export function getEquipmentById(id: string) {
  return api.get<Equipment>(`/equipment/${id}`);
}

export function getEquipmentJournal(id: string) {
  return api.get<EquipmentJournalEntry[]>(`/equipment/${id}/journal`);
}

export function addJournalEntry(id: string, kind: JournalEntryKind, text: string) {
  return api.post<EquipmentJournalEntry>(`/equipment/${id}/journal`, { kind, text });
}

export function assignEquipmentOperator(id: string, operatorId: string) {
  return api.post<void>(`/equipment/${id}/operators`, { operatorId });
}

export function removeEquipmentOperator(id: string, operatorId: string) {
  return api.del<void>(`/equipment/${id}/operators/${operatorId}`);
}
