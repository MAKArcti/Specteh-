import type { UserRole } from '@spectech/shared-types';

/**
 * Mirrors services/api/src/modules/users/dto/public-user.dto.ts, which is a
 * plain API-local interface (not part of @spectech/shared-types) since it's
 * a read-model projection rather than a wire contract shared with writes.
 */
export interface PublicUserDto {
  id: string;
  fullName: string;
  phone: string;
  roles: UserRole[];
}
