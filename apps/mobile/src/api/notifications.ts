import type { Notification } from '@spectech/shared-types';
import { api } from './client';

export function getNotifications() {
  return api.get<Notification[]>('/notifications');
}

export function markAllNotificationsRead() {
  return api.post<void>('/notifications/read-all');
}
