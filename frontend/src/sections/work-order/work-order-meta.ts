import type { User, WorkOrder, WorkOrderStatus, SparepartRequest } from 'src/api';

import { fDateTime } from 'src/utils/format-time';

// ----------------------------------------------------------------------

type StatusColor = 'default' | 'primary' | 'secondary' | 'info' | 'success' | 'warning' | 'error';

export const STATUS_META: Record<WorkOrderStatus, { label: string; color: StatusColor }> = {
  DRAFT: { label: 'Draft', color: 'default' },
  SUBMITTED: { label: 'Submitted', color: 'info' },
  ASSIGNED: { label: 'Assigned', color: 'secondary' },
  UPDATED: { label: 'Updated', color: 'primary' },
  WAITING_SPAREPART: { label: 'Waiting Sparepart', color: 'warning' },
  SPAREPART_APPROVED: { label: 'Sparepart Approved', color: 'success' },
  WORKING: { label: 'On Progress', color: 'warning' },
  COMPLETED: { label: 'Completed', color: 'success' },
};

export const STATUS_OPTIONS = Object.keys(STATUS_META) as WorkOrderStatus[];

/** Short, readable code derived from the uuid (the DB has no separate WO number). */
export const woCode = (id: string) => `WO-${id.slice(0, 8).toUpperCase()}`;

export const fDateOrDash = (value: string | null | undefined) => (value ? fDateTime(value) : '-');

export const getPendingRequest = (wo: WorkOrder): SparepartRequest | undefined =>
  wo.sparepartRequests.find((request) => request.status === 'PENDING');

// ----------------------------------------------------------------------

export type WorkOrderAction =
  | 'submit'
  | 'assign'
  | 'update'
  | 'requestSparepart'
  | 'approveSparepart'
  | 'start'
  | 'complete';

export const ACTION_LABEL: Record<WorkOrderAction, string> = {
  submit: 'Submit',
  assign: 'Assign Mechanic',
  update: 'Update Work Order',
  requestSparepart: 'Request Sparepart',
  approveSparepart: 'Approve Sparepart',
  start: 'Mark as Working',
  complete: 'Complete Work Order',
};

/**
 * Which buttons a user sees for a work order. This only drives the UI: the same
 * rules are enforced by the backend service, so a hidden button is never the
 * only protection.
 */
export function getAvailableActions(wo: WorkOrder, user: User): WorkOrderAction[] {
  const isAdmin = user.role === 'ADMIN';
  const isSpv = user.role === 'SPV';
  const isAssignedMechanic = user.role === 'MECHANIC' && wo.assignedMechanicId === user.id;

  switch (wo.status) {
    case 'DRAFT':
      return isAdmin ? ['submit'] : [];
    case 'SUBMITTED':
      return isSpv ? ['assign'] : [];
    case 'ASSIGNED':
      return isAdmin ? ['update'] : [];
    case 'UPDATED': {
      // "Need sparepart?" No -> mechanic starts. Yes -> admin requests sparepart.
      const actions: WorkOrderAction[] = [];
      if (isAdmin) actions.push('requestSparepart');
      if (isAssignedMechanic) actions.push('start');
      return actions;
    }
    case 'WAITING_SPAREPART':
      return isSpv ? ['approveSparepart'] : [];
    case 'SPAREPART_APPROVED':
      return isAssignedMechanic ? ['start'] : [];
    case 'WORKING':
      return isAdmin ? ['complete'] : [];
    default:
      return [];
  }
}

/** Plain-language hint shown when the current user has nothing to do. */
export const NEXT_STEP: Record<WorkOrderStatus, string> = {
  DRAFT: 'Waiting for Admin to submit.',
  SUBMITTED: 'Waiting for SPV to assign a mechanic.',
  ASSIGNED: 'Waiting for Admin to update the work order.',
  UPDATED:
    'Admin can request spareparts, or the assigned mechanic can start working if none are needed.',
  WAITING_SPAREPART: 'Waiting for SPV to approve the sparepart request.',
  SPAREPART_APPROVED: 'Waiting for the assigned mechanic to start working.',
  WORKING: 'Waiting for Admin to input the end date.',
  COMPLETED: 'This work order is completed.',
};
