import {
  EquipmentStatus,
  EquipmentType,
  JournalEntryKind,
  OrderStatus,
  ReportSyncStatus,
  UserRole,
} from '@spectech/shared-types';

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.EXCAVATOR]: 'Екскаватор',
  [EquipmentType.BULLDOZER]: 'Бульдозер',
  [EquipmentType.CRANE]: 'Кран',
  [EquipmentType.DUMP_TRUCK]: 'Самоскид',
  [EquipmentType.LOADER]: 'Навантажувач',
  [EquipmentType.CONCRETE_MIXER]: 'Бетонозмішувач',
  [EquipmentType.GRADER]: 'Грейдер',
};

export const EQUIPMENT_STATUS_LABELS: Record<EquipmentStatus, string> = {
  [EquipmentStatus.AVAILABLE]: 'Вільна',
  [EquipmentStatus.BOOKED]: 'Заброньована',
  [EquipmentStatus.WORKING]: 'У роботі',
  [EquipmentStatus.MAINTENANCE]: 'На обслуговуванні',
  [EquipmentStatus.BROKEN]: 'Несправна',
  [EquipmentStatus.INACTIVE]: 'Неактивна',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: 'Чернетка',
  [OrderStatus.REQUEST]: 'Запит',
  [OrderStatus.AGREED]: 'Погоджено',
  [OrderStatus.IN_WORK]: 'В роботі',
  [OrderStatus.DONE]: 'Завершено',
  [OrderStatus.CANCELLED]: 'Скасовано',
};

export const JOURNAL_KIND_LABELS: Record<JournalEntryKind, string> = {
  [JournalEntryKind.SERVICE]: 'ТО',
  [JournalEntryKind.OIL]: 'Заміна оливи',
  [JournalEntryKind.REPAIR]: 'Ремонт',
  [JournalEntryKind.BREAKDOWN]: 'Поломка',
  [JournalEntryKind.WORK]: 'Робота',
};

export const REPORT_SYNC_STATUS_LABELS: Record<ReportSyncStatus, string> = {
  [ReportSyncStatus.PENDING]: 'Очікує',
  [ReportSyncStatus.QUEUED]: 'В черзі',
  [ReportSyncStatus.SYNCED]: 'Синхронізовано',
  [ReportSyncStatus.REJECTED]: 'Відхилено',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CUSTOMER]: 'Орендар',
  [UserRole.OPERATOR]: 'Оператор',
  [UserRole.EQUIPMENT_OWNER]: 'Орендодавець',
  [UserRole.ADMIN]: 'Адміністратор',
};

export const ORDER_STATUS_STEPS = [
  OrderStatus.REQUEST,
  OrderStatus.AGREED,
  OrderStatus.IN_WORK,
  OrderStatus.DONE,
] as const;

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';

export function equipmentStatusTone(status: EquipmentStatus): StatusTone {
  switch (status) {
    case EquipmentStatus.AVAILABLE:
      return 'success';
    case EquipmentStatus.BOOKED:
      return 'info';
    case EquipmentStatus.WORKING:
      return 'accent';
    case EquipmentStatus.MAINTENANCE:
      return 'warning';
    case EquipmentStatus.BROKEN:
      return 'danger';
    default:
      return 'neutral';
  }
}

export function orderStatusTone(status: OrderStatus): StatusTone {
  switch (status) {
    case OrderStatus.REQUEST:
      return 'warning';
    case OrderStatus.AGREED:
      return 'info';
    case OrderStatus.IN_WORK:
      return 'accent';
    case OrderStatus.DONE:
      return 'success';
    case OrderStatus.CANCELLED:
      return 'danger';
    default:
      return 'neutral';
  }
}

export function reportSyncTone(status: ReportSyncStatus): StatusTone {
  switch (status) {
    case ReportSyncStatus.SYNCED:
      return 'success';
    case ReportSyncStatus.QUEUED:
      return 'info';
    case ReportSyncStatus.REJECTED:
      return 'danger';
    default:
      return 'neutral';
  }
}
