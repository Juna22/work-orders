import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Role,
  SparepartRequestStatus,
  WorkOrderStatus as S,
} from '../common/enums';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import {
  ApproveSparepartDto,
  AssignMechanicDto,
  CompleteWorkOrderDto,
  CreateWorkOrderDto,
  RequestSparepartDto,
  UpdateWorkOrderDto,
} from './dto/work-order.dto';
import { SparepartItem } from './entities/sparepart-item.entity';
import { SparepartRequest } from './entities/sparepart-request.entity';
import { WorkOrder } from './entities/work-order.entity';
import {
  WORK_ORDER_REPOSITORY,
  WorkOrderRepository,
} from './repositories/work-order.repository';

/**
 * All business rules live here: who may do what, and from which status.
 * Controllers only translate HTTP <-> method calls.
 */
@Injectable()
export class WorkOrdersService {
  constructor(
    @Inject(WORK_ORDER_REPOSITORY) private readonly repo: WorkOrderRepository,
    private readonly users: UsersService,
  ) {}

  list(): Promise<WorkOrder[]> {
    return this.repo.findAll();
  }

  get(id: string): Promise<WorkOrder> {
    return this.getOrFail(id);
  }

  // 1. Admin creates a work order
  async create(dto: CreateWorkOrderDto, actor: User): Promise<WorkOrder> {
    this.assertRole(actor, Role.ADMIN);
    const wo = Object.assign(new WorkOrder(), {
      title: dto.title,
      description: dto.description ?? null,
      status: S.DRAFT,
      createdById: actor.id,
      creator: actor,
    });
    const saved = await this.repo.save(wo);
    return this.getOrFail(saved.id);
  }

  // 2. Admin submits
  submit(id: string, actor: User): Promise<WorkOrder> {
    return this.transition(id, actor, [Role.ADMIN], [S.DRAFT], (wo) => {
      wo.status = S.SUBMITTED;
    });
  }

  // 3. SPV assigns a mechanic
  async assign(
    id: string,
    dto: AssignMechanicDto,
    actor: User,
  ): Promise<WorkOrder> {
    const mechanic = await this.users.findById(dto.mechanicId);
    if (!mechanic || mechanic.role !== Role.MECHANIC) {
      throw new BadRequestException('mechanicId must be an existing mechanic');
    }
    return this.transition(id, actor, [Role.SPV], [S.SUBMITTED], (wo) => {
      // Set both the FK column and the relation object, otherwise TypeORM may
      // keep the stale relation and ignore the new id.
      wo.assignedMechanicId = mechanic.id;
      wo.mechanic = mechanic;
      wo.status = S.ASSIGNED;
    });
  }

  // 4. Admin updates the work order ("lanjutan")
  update(id: string, dto: UpdateWorkOrderDto, actor: User): Promise<WorkOrder> {
    return this.transition(id, actor, [Role.ADMIN], [S.ASSIGNED], (wo) => {
      if (dto.title !== undefined) wo.title = dto.title;
      if (dto.description !== undefined) wo.description = dto.description;
      if (dto.startDate !== undefined) wo.startDate = new Date(dto.startDate);
      wo.status = S.UPDATED;
    });
  }

  // 5. "Need sparepart? Yes" -> Admin creates a sparepart request
  async requestSparepart(
    id: string,
    dto: RequestSparepartDto,
    actor: User,
  ): Promise<WorkOrder> {
    return this.transition(id, actor, [Role.ADMIN], [S.UPDATED], (wo) => {
      const request = Object.assign(new SparepartRequest(), {
        status: SparepartRequestStatus.PENDING,
        requestedById: actor.id,
        requestedBy: actor,
        approvedById: null,
        approvedBy: null,
        approvalNote: null,
        items: dto.items.map((i) =>
          Object.assign(new SparepartItem(), { name: i.name, qty: i.qty }),
        ),
      });
      wo.sparepartRequests = [...(wo.sparepartRequests ?? []), request];
      wo.status = S.WAITING_SPAREPART;
    });
  }

  // 6. SPV approves the sparepart request
  async approveSparepart(
    requestId: string,
    dto: ApproveSparepartDto,
    actor: User,
  ): Promise<WorkOrder> {
    this.assertRole(actor, Role.SPV);
    const wo = await this.repo.findBySparepartRequestId(requestId);
    if (!wo) throw new NotFoundException('Sparepart request not found');
    this.assertStatus(wo, [S.WAITING_SPAREPART]);

    const request = wo.sparepartRequests.find((r) => r.id === requestId)!;
    if (request.status !== SparepartRequestStatus.PENDING) {
      throw new ConflictException('Sparepart request is already approved');
    }
    request.status = SparepartRequestStatus.APPROVED;
    request.approvedById = actor.id;
    request.approvedBy = actor;
    request.approvalNote = dto.approvalNote ?? null;
    wo.status = S.SPAREPART_APPROVED;

    await this.repo.save(wo); // cascades to the request in one transaction
    return this.getOrFail(wo.id);
  }

  // 7. Mechanic marks the work order as working
  start(id: string, actor: User): Promise<WorkOrder> {
    return this.transition(
      id,
      actor,
      [Role.MECHANIC],
      [S.UPDATED, S.SPAREPART_APPROVED],
      (wo) => {
        // Assumption: only the assigned mechanic may start the work.
        if (wo.assignedMechanicId !== actor.id) {
          throw new ForbiddenException(
            'Only the assigned mechanic can start this work order',
          );
        }
        wo.status = S.WORKING;
        wo.startDate = wo.startDate ?? new Date();
      },
    );
  }

  // 8. Admin inputs the end date -> completed
  complete(
    id: string,
    dto: CompleteWorkOrderDto,
    actor: User,
  ): Promise<WorkOrder> {
    return this.transition(id, actor, [Role.ADMIN], [S.WORKING], (wo) => {
      const end = new Date(dto.endDate);
      if (wo.startDate && end < wo.startDate) {
        throw new BadRequestException('endDate cannot be before startDate');
      }
      wo.endDate = end;
      wo.status = S.COMPLETED;
    });
  }

  // ---- helpers -----------------------------------------------------------

  /** Load -> check role -> check current status -> mutate -> save -> reload. */
  private async transition(
    id: string,
    actor: User,
    allowedRoles: Role[],
    allowedFrom: S[],
    apply: (wo: WorkOrder) => void,
  ): Promise<WorkOrder> {
    this.assertRole(actor, ...allowedRoles);
    const wo = await this.getOrFail(id);
    this.assertStatus(wo, allowedFrom);
    apply(wo);
    await this.repo.save(wo);
    return this.getOrFail(id);
  }

  private async getOrFail(id: string): Promise<WorkOrder> {
    const wo = await this.repo.findById(id);
    if (!wo) throw new NotFoundException('Work order not found');
    return wo;
  }

  private assertRole(actor: User, ...roles: Role[]): void {
    if (!roles.includes(actor.role)) {
      throw new ForbiddenException(
        `Role ${actor.role} is not allowed to do this (requires ${roles.join(' or ')})`,
      );
    }
  }

  private assertStatus(wo: WorkOrder, allowed: S[]): void {
    if (!allowed.includes(wo.status)) {
      throw new ConflictException(
        `Work order is ${wo.status}; this action requires ${allowed.join(' or ')}`,
      );
    }
  }
}
