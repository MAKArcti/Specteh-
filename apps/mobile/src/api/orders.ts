import type { AssignOrderDto, CreateOrderDto, Order } from '@spectech/shared-types';
import { api } from './client';

export function createOrder(dto: CreateOrderDto) {
  return api.post<Order>('/orders', dto);
}

export function getMyOrders() {
  return api.get<Order[]>('/orders/mine');
}

export function getOrdersForOperator() {
  return api.get<Order[]>('/orders/for-operator');
}

export function getActionableOrders() {
  return api.get<Order[]>('/orders/actionable');
}

export function getOrderById(id: string) {
  return api.get<Order>(`/orders/${id}`);
}

export function assignOrder(id: string, dto: AssignOrderDto) {
  return api.post<Order>(`/orders/${id}/assign`, dto);
}

export function startContract(id: string) {
  return api.post<Order>(`/orders/${id}/start-contract`);
}

export function cancelOrder(id: string) {
  return api.post<Order>(`/orders/${id}/cancel`);
}
