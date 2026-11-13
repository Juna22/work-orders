import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { WorkOrdersModule } from './work-orders/work-orders.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'wo_user',
      password: process.env.DB_PASSWORD ?? 'wo_pass',
      database: process.env.DB_NAME ?? 'wo_db',
      autoLoadEntities: true,
      // Assumption: schema auto-sync is fine for a test project (no migrations).
      synchronize: true,
      retryAttempts: 10,
      retryDelay: 2000,
    }),
    UsersModule,
    WorkOrdersModule,
  ],
})
export class AppModule {}
