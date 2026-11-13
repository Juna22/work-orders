import { WorkOrder } from '../entities/work-order.entity';

/** Injection token for the abstraction (interfaces don't exist at runtime). */
export const WORK_ORDER_REPOSITORY = Symbol('WORK_ORDER_REPOSITORY');

/**
 * Persistence contract used by the service layer.
 * The service never touches TypeORM directly, so the storage can be swapped
 * (or mocked in unit tests) without changing business logic.
 */
export interface WorkOrderRepository {
  findAll(): Promise<WorkOrder[]>;
  findById(id: string): Promise<WorkOrder | null>;
  findBySparepartRequestId(requestId: string): Promise<WorkOrder | null>;
  save(workOrder: WorkOrder): Promise<WorkOrder>;
}
