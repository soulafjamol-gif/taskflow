import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
  Check,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';
import { Task } from '../../tasks/entities/task.entity.js';

/**
 * جدول categories — تصنيفات افتراضية مشتركة (user_id = NULL) +
 * تصنيفات مخصصة لكل مستخدم.
 */
@Entity('categories')
@Check(`"color" ~ '^#[0-9A-Fa-f]{6}$'`)
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index() // idx_categories_user_id
  @Column({ type: 'uuid', nullable: true, name: 'user_id' })
  userId: string | null;

  @ManyToOne(() => User, (user) => user.categories, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User | null;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 7 })
  color: string;

  @Column({ type: 'boolean', default: false, name: 'is_custom' })
  isCustom: boolean;

  @CreateDateColumn({ type: 'timestamptz', name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Task, (task) => task.category)
  tasks: Task[];
}
