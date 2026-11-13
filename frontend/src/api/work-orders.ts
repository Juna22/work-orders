import { http } from './client';

import type { User, WorkOrder } from './types';

// ----------------------------------------------------------------------

export const listUsers = () => http.get<User[]>('/users');

export const listWorkOrders = () => http.get<WorkOrder[]>('/work-orders');

export const getWorkOrder = (id: string) => http.get<WorkOrder>(`/work-orders/${id}`);

export const createWorkOrder = (body: { title: string; description?: string }) =>
  http.post<WorkOrder>('/work-orders', body);

export const submitWorkOrder = (id: string) => http.post<WorkOrder>(`/work-orders/${id}/submit`);

export const assignMechanic = (id: string, mechanicId: string) =>
  http.post<WorkOrder>(`/work-orders/${id}/assign`, { mechanicId });

export const updateWorkOrder = (
  id: string,
  body: { title?: string; description?: string; startDate?: string }
) => http.post<WorkOrder>(`/work-orders/${id}/update`, body);

export const requestSparepart = (id: string, items: { name: string; qty: number }[]) =>
  http.post<WorkOrder>(`/work-orders/${id}/request-sparepart`, { items });

export const approveSparepart = (requestId: string, approvalNote?: string) =>
  http.post<WorkOrder>(`/sparepart-requests/${requestId}/approve`, { approvalNote });

export const startWorkOrder = (id: string) => http.post<WorkOrder>(`/work-orders/${id}/start`);

export const completeWorkOrder = (id: string, endDate: string) =>
  http.post<WorkOrder>(`/work-orders/${id}/complete`, { endDate });
