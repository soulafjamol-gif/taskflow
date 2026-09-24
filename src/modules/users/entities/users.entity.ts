import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Task } from '../../tasks/entities/task.entity';
import { Category } from '../../categories/entities/category.entity';
import { PomodoroSession } from '../../pomodoro-sessions/entities/pomodoro-session.entity';
import { UserSettings } from '../../user-settings/entities/user-settings.entity';
import { DailyStat } from '../../daily-stats/entities/daily-stat.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Exclude() // طبقة حماية إضافية عند التحويل لـ JSON (class-transformer)
  @Column({ type: 'varchar', length: 255, select: false, name: 'password_hash' })
  passwordHash: string;

  @Column({ type: 'timestamptz', nullable: true, name: 'last_login_at' })
  lastLoginAt: Date | null;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;

  @DeleteDateColumn({ type: 'timestamptz', name: 'deleted_at' })
  deletedAt: Date | null;

  // ===== العلاقات (Relations) =====

  @OneToMany(() => Task, (task) => task.user)
  tasks: Task[];

  @OneToMany(() => Category, (category) => category.user)
  categories: Category[];

  @OneToMany(() => PomodoroSession, (session) => session.user)
  pomodoroSessions: PomodoroSession[];

  @OneToOne(() => UserSettings, (settings) => settings.user)
  settings: UserSettings;

  @OneToMany(() => DailyStat, (stat) => stat.user)
  dailyStats: DailyStat[];
}
