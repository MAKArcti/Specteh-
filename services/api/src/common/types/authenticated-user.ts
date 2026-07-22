import { UserRole } from '@spectech/shared-types';

export interface AuthenticatedUser {
  id: string;
  /** First of `roles` — kept for the legacy single-role web flow. */
  role: UserRole;
  roles: UserRole[];
}
