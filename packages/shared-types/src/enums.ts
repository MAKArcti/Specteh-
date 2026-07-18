export enum UserRole {
  CUSTOMER = 'customer',
  OPERATOR = 'operator',
  EQUIPMENT_OWNER = 'equipment_owner',
  ADMIN = 'admin',
}

export enum EquipmentType {
  EXCAVATOR = 'excavator',
  BULLDOZER = 'bulldozer',
  CRANE = 'crane',
  DUMP_TRUCK = 'dump_truck',
  LOADER = 'loader',
  CONCRETE_MIXER = 'concrete_mixer',
  GRADER = 'grader',
}

export enum EquipmentStatus {
  AVAILABLE = 'available',
  BOOKED = 'booked',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
}

export enum RequestStatus {
  OPEN = 'open',
  MATCHED = 'matched',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

/**
 * Deal lifecycle. Linear/forward-only (see services/api/src/modules/deals) except
 * for the explicit CANCELLED/DISPUTED escapes, which are terminal.
 */
export enum DealStatus {
  PENDING_CONFIRMATION = 'pending_confirmation',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  SETTLED = 'settled',
  CANCELLED = 'cancelled',
  DISPUTED = 'disputed',
}

export enum ReportSyncStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  SYNCED = 'synced',
  REJECTED = 'rejected',
}

export enum WorkVolumeUnit {
  HOURS = 'hours',
  CUBIC_METERS = 'cubic_meters',
  TONS = 'tons',
  TRIPS = 'trips',
}
