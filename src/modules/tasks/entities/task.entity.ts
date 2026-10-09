import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Category } from '../../categories/entities/category.entity.js';
import { PomodoroSession } from '../../pomodoro-sessions/entities/pomodoro-session.entity.js';
import { TaskPriority } from '../../../common/enums/task-priority.enum.js';

@Entity('tasks')
@Index('idx_tasks_user_completed_order', ['userId', 'isCompleted', 'orderIndex'])
@Index('idx_tasks_due_date', ['dueDate'], { where: '"due_date" IS NOT NULL' })
@Check(
  `("is_completed" = false AND "completed_at" IS NULL) OR ("is_completed" = true AND "completed_at" IS NOT NULL)`,
)
@Check(`"description" IS NULL OR char_length("description") <= 500`)
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.tasks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ type: 'uuid', name: 'category_id' })
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.tasks, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'varchar', length: 100 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: TaskPriority, enumName: 'task_priority' })
  priority: TaskPriority;

  @Column({ type: 'date', nullable: true, name: 'due_date' })
  dueDate: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_completed' })
  isCompleted: boolean;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @Column({ type: 'integer', name: 'order_index' })
  orderIndex: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => PomodoroSession, (session) => session.task)
  pomodoroSessions: PomodoroSession[];
}
