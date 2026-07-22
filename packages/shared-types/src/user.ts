import { UserRole } from './enums';

/**
 * `role` is the first entry of `roles` (kept for the legacy single-role web
 * flow and JWT back-compat); `roles` is the full set for accounts with more
 * than one — the SoW requires "Підтримка кількох ролей в одному акаунті".
 */
export interface User {
  id: string;
  role: UserRole;
  roles: UserRole[];
  fullName: string;
  phone: string;
  email?: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}

export interface RegisterDto {
  roles: UserRole[];
  fullName: string;
  phone: string;
  email?: string;
  password: string;
}
