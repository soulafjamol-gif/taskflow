import {
  Entity,
  Column,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  PrimaryColumn,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { ThemeMode } from '../../../common/enums/theme-mode.enum.js';

@Entity('user_settings')
@Check(`"pomodoro_work_duration" > 0`)
@Check(`"pomodoro_break_duration" > 0`)
export class UserSettings {
  @PrimaryColumn({ type: 'uuid', name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.settings, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    type: 'enum',
    enum: ThemeMode,
    enumName: 'theme_mode',
    default: ThemeMode.LIGHT,
  })
  theme: ThemeMode;

  @Column({ type: 'integer', default: 1500, name: 'pomodoro_work_duration' })
  pomodoroWorkDuration: number;

  @Column({ type: 'integer', default: 300, name: 'pomodoro_break_duration' })
  pomodoroBreakDuration: number;

  @Column({ type: 'boolean', default: false, name: 'pomodoro_auto_start' })
  pomodoroAutoStart: boolean;

  @Column({ type: 'boolean', default: true, name: 'pomodoro_sound_enabled' })
  pomodoroSoundEnabled: boolean;

  @UpdateDateColumn({ type: 'timestamptz', name: 'updated_at' })
  updatedAt: Date;
}
