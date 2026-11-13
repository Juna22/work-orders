export enum Role {
  ADMIN = 'ADMIN',
  SPV = 'SPV',
  MECHANIC = 'MECHANIC',
}

/**
 * Simplified status flow (see README):
 * DRAFT -> SUBMITTED -> ASSIGNED -> UPDATED
 *   UPDATED -> WORKING                       (no sparepart needed)
 *   UPDATED -> WAITING_SPAREPART -> SPAREPART_APPROVED -> WORKING
 * WORKING -> COMPLETED
 */
export enum WorkOrderStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  ASSIGNED = 'ASSIGNED',
  UPDATED = 'UPDATED',
  WAITING_SPAREPART = 'WAITING_SPAREPART',
  SPAREPART_APPROVED = 'SPAREPART_APPROVED',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
}

export enum SparepartRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}
