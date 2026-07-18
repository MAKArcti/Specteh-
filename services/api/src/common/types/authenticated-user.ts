import { UserRole } from '@spectech/shared-types';

export interface AuthenticatedUser {
  id: string;
  role: UserRole;
}
