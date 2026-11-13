import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActorGuard } from '../common/actor.guard';
import { UsersModule } from '../users/users.module';
import { SparepartItem } from './entities/sparepart-item.entity';
import { SparepartRequest } from './entities/sparepart-request.entity';
import { WorkOrder } from './entities/work-order.entity';
import { TypeOrmWorkOrderRepository } from './repositories/typeorm-work-order.repository';
import { WORK_ORDER_REPOSITORY } from './repositories/work-order.repository';
import {
  SparepartRequestsController,
  WorkOrdersController,
} from './work-orders.controller';
import { WorkOrdersService } from './work-orders.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([WorkOrder, SparepartRequest, SparepartItem]),
    UsersModule,
  ],
  controllers: [WorkOrdersController, SparepartRequestsController],
  providers: [
    WorkOrdersService,
    ActorGuard,
    // Bind the interface token to the TypeORM implementation.
    { provide: WORK_ORDER_REPOSITORY, useClass: TypeOrmWorkOrderRepository },
  ],
})
export class WorkOrdersModule {}
