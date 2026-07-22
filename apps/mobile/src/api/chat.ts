import type { ChatMessage } from '@spectech/shared-types';
import { api } from './client';

export function getMessages(orderId: string) {
  return api.get<ChatMessage[]>(`/orders/${orderId}/messages`);
}

export function sendMessage(orderId: string, text: string) {
  return api.post<ChatMessage>(`/orders/${orderId}/messages`, { text });
}
