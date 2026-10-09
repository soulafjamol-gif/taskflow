import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PomodoroSession } from './entities/pomodoro-session.entity.js';
import { CreatePomodoroSessionDto } from './dto/create-pomodoro-session.dto.js';
import { TasksService } from '../tasks/tasks.service.js';

@Injectable()
export class PomodoroSessionsService {
  constructor(
    @InjectRepository(PomodoroSession)
    private readonly pomodoroSessionsRepository: Repository<PomodoroSession>,
    private readonly tasksService: TasksService,
  ) {}

  /**
   * تسجيل جلسة عمل مكتملة (قرار متفق عليه: work فقط، لا break).
   * لو taskId موجود، نتأكد إنه فعلًا يخص هذا المستخدم عبر
   * TasksService (Module Pattern — بدل حقن Repository<Task> هون).
   *
   * ملاحظة: ما في أي لمس لـ daily_stats هون — الجلسات لا تؤثر على
   * completed_count/total_count (هذول خاصين بالمهام فقط)، هي جدول
   * مستقل بالكامل تحسب منه totalPomodoroSessions لاحقًا Live.
   */
  async create(userId: string, dto: CreatePomodoroSessionDto): Promise<PomodoroSession> {
    if (dto.taskId) {
      await this.tasksService.findAccessibleOrThrow(userId, dto.taskId);
    }

    const session = this.pomodoroSessionsRepository.create({
      userId,
      taskId: dto.taskId ?? null,
      durationSeconds: dto.durationSeconds ?? 1500,
    });

    return this.pomodoroSessionsRepository.save(session);
  }

  async findAllForUser(userId: string): Promise<PomodoroSession[]> {
    return this.pomodoroSessionsRepository.find({
      where: { userId },
      order: { completedAt: 'DESC' },
    });
  }

  /** إجمالي الجلسات المكتملة — محسوب Live، غير مخزّن (قرار Phase 7) */
  async getTotalCount(userId: string): Promise<number> {
    return this.pomodoroSessionsRepository.count({ where: { userId } });
  }

  /** عدد الجلسات المرتبطة بمهمة معيّنة — نفس منطق Live computation */
  async getCountForTask(userId: string, taskId: string): Promise<number> {
    return this.pomodoroSessionsRepository.count({ where: { userId, taskId } });
  }
}
