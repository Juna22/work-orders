import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ActorGuard } from '../common/actor.guard';
import { CurrentUser } from '../common/current-user.decorator';
import { User } from '../users/user.entity';
import {
  ApproveSparepartDto,
  AssignMechanicDto,
  CompleteWorkOrderDto,
  CreateWorkOrderDto,
  RequestSparepartDto,
  UpdateWorkOrderDto,
} from './dto/work-order.dto';
import { WorkOrdersService } from './work-orders.service';

/** HTTP layer only: parse input, call the service, return the result. */
@Controller('work-orders')
@UseGuards(ActorGuard)
export class WorkOrdersController {
  constructor(private readonly service: WorkOrdersService) {}

  @Get()
  list() {
    return this.service.list();
  }

  @Get(':id')
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(id);
  }

  @Post()
  create(@Body() dto: CreateWorkOrderDto, @CurrentUser() actor: User) {
    return this.service.create(dto, actor);
  }

  @Post(':id/submit')
  @HttpCode(200)
  submit(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: User) {
    return this.service.submit(id, actor);
  }

  @Post(':id/assign')
  @HttpCode(200)
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AssignMechanicDto,
    @CurrentUser() actor: User,
  ) {
    return this.service.assign(id, dto, actor);
  }

  @Post(':id/update')
  @HttpCode(200)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateWorkOrderDto,
    @CurrentUser() actor: User,
  ) {
    return this.service.update(id, dto, actor);
  }

  @Post(':id/request-sparepart')
  @HttpCode(200)
  requestSparepart(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RequestSparepartDto,
    @CurrentUser() actor: User,
  ) {
    return this.service.requestSparepart(id, dto, actor);
  }

  @Post(':id/start')
  @HttpCode(200)
  start(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() actor: User) {
    return this.service.start(id, actor);
  }

  @Post(':id/complete')
  @HttpCode(200)
  complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteWorkOrderDto,
    @CurrentUser() actor: User,
  ) {
    return this.service.complete(id, dto, actor);
  }
}

@Controller('sparepart-requests')
@UseGuards(ActorGuard)
export class SparepartRequestsController {
  constructor(private readonly service: WorkOrdersService) {}

  /** Returns the updated work order so the UI can refresh in one call. */
  @Post(':id/approve')
  @HttpCode(200)
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveSparepartDto,
    @CurrentUser() actor: User,
  ) {
    return this.service.approveSparepart(id, dto, actor);
  }
}
