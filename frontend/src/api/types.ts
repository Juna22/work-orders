// Mirrors the backend response shapes (see backend/src/**/entities).

export type Role = 'ADMIN' | 'SPV' | 'MECHANIC';

export type WorkOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ASSIGNED'
  | 'UPDATED'
  | 'WAITING_SPAREPART'
  | 'SPAREPART_APPROVED'
  | 'WORKING'
  | 'COMPLETED';

export type SparepartRequestStatus = 'PENDING' | 'APPROVED';

export type User = {
  id: string;
  name: string;
  role: Role;
};

export type SparepartItem = {
  id: string;
  name: string;
  qty: number;
};

export type SparepartRequest = {
  id: string;
  status: SparepartRequestStatus;
  requestedBy: User | null;
  approvedBy: User | null;
  approvalNote: string | null;
  items: SparepartItem[];
  createdAt: string;
};

export type WorkOrder = {
  id: string;
  title: string;
  description: string | null;
  status: WorkOrderStatus;
  createdById: string;
  creator: User | null;
  assignedMechanicId: string | null;
  mechanic: User | null;
  startDate: string | null;
  endDate: string | null;
  sparepartRequests: SparepartRequest[];
  createdAt: string;
  updatedAt: string;
};
