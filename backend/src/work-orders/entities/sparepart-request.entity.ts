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
import { SparepartRequestStatus } from '../../common/enums';
import { User } from '../../users/user.entity';
import { SparepartItem } from './sparepart-item.entity';
import { WorkOrder } from './work-order.entity';

@Entity('sparepart_requests')
export class SparepartRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'work_order_id', type: 'uuid' })
  workOrderId: string;

  @ManyToOne(() => WorkOrder, (wo) => wo.sparepartRequests, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @Column({ type: 'varchar', default: SparepartRequestStatus.PENDING })
  status: SparepartRequestStatus;

  @Column({ name: 'requested_by', type: 'uuid' })
  requestedById: string;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'requested_by' })
  requestedBy: User;

  @Column({ name: 'approved_by', type: 'uuid', nullable: true })
  approvedById: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedBy: User | null;

  @Column({ name: 'approval_note', type: 'text', nullable: true })
  approvalNote: string | null;

  @OneToMany(() => SparepartItem, (i) => i.sparepartRequest, {
    cascade: ['insert', 'update'],
  })
  items: SparepartItem[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
