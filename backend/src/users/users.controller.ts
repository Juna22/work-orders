import { Controller, Get, Query } from '@nestjs/common';
import { Role } from '../common/enums';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Used by the frontend role selector and the "assign mechanic" dropdown. */
  @Get()
  findAll(@Query('role') role?: string) {
    const parsed = Object.values(Role).find((r) => r === role);
    return this.users.findAll(parsed);
  }
}
