import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('daily_stats')
@Unique('uq_daily_stats_user_date', ['userId', 'date'])
@Check(
  `"completed_count" >= 0 AND "total_count" >= 0 AND "completed_count" <= "total_count"`,
)
export class DailyStat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.dailyStats, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'integer', default: 0, name: 'completed_count' })
  completedCount: number;

  @Column({ type: 'integer', default: 0, name: 'total_count' })
  totalCount: number;
}
