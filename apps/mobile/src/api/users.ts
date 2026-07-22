import type { PublicUserDto } from './types';
import { api } from './client';

export function getOperators() {
  return api.get<PublicUserDto[]>('/users/operators');
}
