import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../common/enums';
import { User } from './user.entity';

@Injectable()
export class UsersService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
  ) {}

  /** Seed demo users on first start so the role selector has data. */
  async onApplicationBootstrap(): Promise<void> {
    if ((await this.repo.count()) > 0) return;
    await this.repo.save([
      this.repo.create({ name: 'Budi (Admin)', role: Role.ADMIN }),
      this.repo.create({ name: 'Sari (SPV)', role: Role.SPV }),
      this.repo.create({ name: 'Joko (Mechanic)', role: Role.MECHANIC }),
      this.repo.create({ name: 'Dewi (Mechanic)', role: Role.MECHANIC }),
    ]);
  }

  findAll(role?: Role): Promise<User[]> {
    return this.repo.find({
      where: role ? { role } : {},
      order: { role: 'ASC', name: 'ASC' },
    });
  }

  findById(id: string): Promise<User | null> {
    return this.repo.findOne({ where: { id } });
  }
}
