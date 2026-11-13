import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';
import { UsersService } from '../users/users.service';

/**
 * Authentication is out of scope for the test, so the "logged in" user is
 * simply identified by the X-User-Id header (the frontend role selector sets it).
 * This guard only identifies WHO is calling. WHAT they may do is decided in the
 * service layer (business rules).
 */
@Injectable()
export class ActorGuard implements CanActivate {
  constructor(private readonly users: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const id = req.headers['x-user-id'];
    if (typeof id !== 'string' || !isUUID(id)) {
      throw new UnauthorizedException('Missing or invalid X-User-Id header');
    }
    const user = await this.users.findById(id);
    if (!user) throw new UnauthorizedException('Unknown user');
    req.user = user;
    return true;
  }
}
