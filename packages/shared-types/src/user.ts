import { UserRole } from './enums';

export interface User {
  id: string;
  role: UserRole;
  fullName: string;
  phone: string;
  email?: string;
  ratingAvg: number;
  ratingCount: number;
  createdAt: string;
}
