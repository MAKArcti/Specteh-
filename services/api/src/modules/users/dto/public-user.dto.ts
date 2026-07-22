import { UserRole } from '@spectech/shared-types';

/** Safe-to-share subset of UserEntity (no passwordHash) for roster pickers. */
export interface PublicUserDto {
  id: string;
  fullName: string;
  phone: string;
  roles: UserRole[];
}
