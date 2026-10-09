import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyStat } from './entities/daily-stat.entity.js';

/**
 * DailyStatsService
 *
 * مسؤول عن جدول daily_stats بس — صف واحد لكل (مستخدم + يوم).
 * لا يُستدعى مباشرة من الـ Frontend للتعديل (لا Create/Update DTO
 * عام) — بيتحدّث داخليًا فقط عبر TasksService لما تُنشأ/تُكمَل/تُحذف
 * مهمة (قرار Phase 6 و16 — هذا الجدول "بيانات منتج"، مش مدخل مباشر
 * من المستخدم).
 *
 * current_streak غير مخزّن (قرار Phase 7) — يُحسب هنا Live بدالة
 * getCurrentStreak() من صفوف الجدول مباشرة.
 */
@Injectable()
export class DailyStatsService {
  constructor(
    @InjectRepository(DailyStat)
    private readonly dailyStatsRepository: Repository<DailyStat>,
  ) {}

  /** يحوّل Date لصيغة YYYY-MM-DD المطابقة لعمود DATE بقاعدة البيانات */
  private toDateKey(date: Date = new Date()): string {
    return date.toISOString().slice(0, 10);
  }

  /**
   * يرجّع صف إحصائية اليوم لمستخدم معيّن، وينشئه بقيم صفرية لو
   * ما كان موجودًا أصلًا (أول مهمة باليوم). هذه الدالة الأساسية
   * التي تستدعيها TasksService بكل تغيير يمس عدّاد المهام اليومي.
   */
  async getOrCreateToday(userId: string): Promise<DailyStat> {
    const today = this.toDateKey();
    let stat = await this.dailyStatsRepository.findOne({
      where: { userId, date: today },
    });

    if (!stat) {
      stat = this.dailyStatsRepository.create({
        userId,
        date: today,
        completedCount: 0,
        totalCount: 0,
      });
      stat = await this.dailyStatsRepository.save(stat);
    }

    return stat;
  }

  /**
   * تُستدعى من TasksService.create() — مهمة جديدة بتاريخ استحقاق
   * اليوم (أو بدون تاريخ) تزيد إجمالي مهام اليوم.
   */
  async incrementTotal(userId: string): Promise<void> {
    const stat = await this.getOrCreateToday(userId);
    stat.totalCount += 1;
    await this.dailyStatsRepository.save(stat);
  }

  /**
   * تُستدعى من TasksService.remove() لو المهمة المحذوفة كانت
   * تخص إحصائية اليوم — تنقص الإجمالي (وأيضًا المكتمل لو كانت
   * مكتملة، عبر الوسيط wasCompleted).
   */
  async decrementTotal(userId: string, wasCompleted: boolean): Promise<void> {
    const stat = await this.getOrCreateToday(userId);
    stat.totalCount = Math.max(0, stat.totalCount - 1);
    if (wasCompleted) {
      stat.completedCount = Math.max(0, stat.completedCount - 1);
    }
    await this.dailyStatsRepository.save(stat);
  }

  /** تُستدعى من TasksService.toggleComplete() عند إكمال مهمة */
  async incrementCompleted(userId: string): Promise<void> {
    const stat = await this.getOrCreateToday(userId);
    stat.completedCount = Math.min(stat.totalCount, stat.completedCount + 1);
    await this.dailyStatsRepository.save(stat);
  }

  /** تُستدعى من TasksService.toggleComplete() عند التراجع عن الإكمال */
  async decrementCompleted(userId: string): Promise<void> {
    const stat = await this.getOrCreateToday(userId);
    stat.completedCount = Math.max(0, stat.completedCount - 1);
    await this.dailyStatsRepository.save(stat);
  }

  /** إحصائية نطاق تاريخي (مثلاً آخر 7 أيام لعرض ملخص أسبوعي) */
  async findRange(userId: string, from: string, to: string): Promise<DailyStat[]> {
    return this.dailyStatsRepository
      .createQueryBuilder('stat')
      .where('stat.user_id = :userId', { userId })
      .andWhere('stat.date BETWEEN :from AND :to', { from, to })
      .orderBy('stat.date', 'ASC')
      .getMany();
  }

  /**
   * أطول سلسلة أيام متتالية بإنجاز (Streak) — محسوبة Live، غير
   * مخزّنة (قرار Phase 7). تُحسب من آخر يوم للخلف حتى ينقطع التتابع.
   */
  async getCurrentStreak(userId: string): Promise<number> {
    const stats = await this.dailyStatsRepository
      .createQueryBuilder('stat')
      .where('stat.user_id = :userId', { userId })
      .andWhere('stat.completed_count > 0')
      .orderBy('stat.date', 'DESC')
      .getMany();

    if (stats.length === 0) return 0;

    const completedDays = new Set(stats.map((s) => s.date));

    // نبلش من اليوم؛ لو اليوم لسا بلا إنجاز (المستخدم ممكن يكمّل
    // لاحقًا خلال اليوم)، ما نكسر السلسلة فورًا — نبلش نعد من
    // "أمس" بدل هيك، عشان سلسلة محققة فعليًا لغاية أمس تضل تنحسب.
    let cursor = new Date(this.toDateKey());
    if (!completedDays.has(this.toDateKey(cursor))) {
      cursor.setDate(cursor.getDate() - 1);
    }

    let streak = 0;
    while (completedDays.has(this.toDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    return streak;
  }
}
