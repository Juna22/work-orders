import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkOrderStatus } from '../../common/enums';
import { User } from '../../users/user.entity';
import { SparepartRequest } from './sparepart-request.entity';

@Entity('work_orders')
export class WorkOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', default: WorkOrderStatus.DRAFT })
  status: WorkOrderStatus;

  @Column({ name: 'created_by', type: 'uuid' })
  createdById: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @Column({ name: 'assigned_mechanic_id', type: 'uuid', nullable: true })
  assignedMechanicId: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assigned_mechanic_id' })
  mechanic: User | null;

  @Column({ name: 'start_date', type: 'timestamptz', nullable: true })
  startDate: Date | null;

  @Column({ name: 'end_date', type: 'timestamptz', nullable: true })
  endDate: Date | null;

  // cascade: saving a work order also saves its sparepart requests (+ items),
  // so "approve" can change request and work order status in one transaction.
  @OneToMany(() => SparepartRequest, (r) => r.workOrder, {
    cascade: ['insert', 'update'],
  })
  sparepartRequests: SparepartRequest[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
