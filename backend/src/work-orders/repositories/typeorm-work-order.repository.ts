import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsRelations, Repository } from 'typeorm';
import { SparepartRequest } from '../entities/sparepart-request.entity';
import { WorkOrder } from '../entities/work-order.entity';
import { WorkOrderRepository } from './work-order.repository';

// Always load the full aggregate. This matters for cascade saves: a partially
// loaded collection could make TypeORM orphan rows that were simply not loaded.
const RELATIONS: FindOptionsRelations<WorkOrder> = {
  creator: true,
  mechanic: true,
  sparepartRequests: { items: true, requestedBy: true, approvedBy: true },
};

@Injectable()
export class TypeOrmWorkOrderRepository implements WorkOrderRepository {
  constructor(
    @InjectRepository(WorkOrder)
    private readonly workOrders: Repository<WorkOrder>,
    @InjectRepository(SparepartRequest)
    private readonly requests: Repository<SparepartRequest>,
  ) {}

  findAll(): Promise<WorkOrder[]> {
    return this.workOrders.find({
      relations: RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  findById(id: string): Promise<WorkOrder | null> {
    return this.workOrders.findOne({ where: { id }, relations: RELATIONS });
  }

  async findBySparepartRequestId(requestId: string): Promise<WorkOrder | null> {
    const request = await this.requests.findOne({
      where: { id: requestId },
      select: { id: true, workOrderId: true },
    });
    return request ? this.findById(request.workOrderId) : null;
  }

  save(workOrder: WorkOrder): Promise<WorkOrder> {
    return this.workOrders.save(workOrder);
  }
}
