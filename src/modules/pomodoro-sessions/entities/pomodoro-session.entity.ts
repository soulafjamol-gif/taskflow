import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Task } from '../../tasks/entities/task.entity.js';

@Entity('pomodoro_sessions')
@Index('idx_pomodoro_sessions_user_completed_at', ['userId', 'completedAt'])
@Check(`"duration_seconds" > 0`)
export class PomodoroSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.pomodoroSessions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Index()
  @Column({ type: 'uuid', nullable: true, name: 'task_id' })
  taskId: string | null;

  @ManyToOne(() => Task, (task) => task.pomodoroSessions, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'task_id' })
  task: Task | null;

  @Column({ type: 'integer', default: 1500, name: 'duration_seconds' })
  durationSeconds: number;

  @CreateDateColumn({ type: 'timestamptz', name: 'completed_at' })
  completedAt: Date;
}
