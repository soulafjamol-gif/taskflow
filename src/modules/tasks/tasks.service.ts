import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Task } from './entities/task.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { FilterTasksDto } from './dto/filter-tasks.dto.js';
import { ReorderTasksDto } from './dto/reorder-tasks.dto.js';
import { TaskStatusFilter } from '../../common/enums/task-status-filter.enum.js';
import { CategoriesService } from '../categories/categories.service.js';
import { DailyStatsService } from '../daily-stats/daily-stats.service.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    private readonly dataSource: DataSource,
    private readonly categoriesService: CategoriesService,
    private readonly dailyStatsService: DailyStatsService,
  ) {}

  /**
   * إضافة مهمة (قسم 2.1.1). خطوتين قبل الحفظ:
   * (1) التأكد إنه categoryId فعلًا يقدر هذا المستخدم يستخدمه —
   *     عبر CategoriesService بدل حقن Repository<Category> مباشرة
   *     (Module Pattern حسب AGENTS.md).
   * (2) حساب orderIndex تلقائيًا (آخر ترتيب + 1) — العميل ما بيرسله.
   */
  async create(userId: string, dto: CreateTaskDto): Promise<Task> {
    await this.categoriesService.findAccessibleOrThrow(userId, dto.categoryId);

    const { max } = await this.tasksRepository
      .createQueryBuilder('task')
      .select('MAX(task.orderIndex)', 'max')
      .where('task.user_id = :userId', { userId })
      .getRawOne<{ max: number | null }>();

    const task = this.tasksRepository.create({
      ...dto,
      userId,
      orderIndex: (max ?? -1) + 1,
    });

    const saved = await this.tasksRepository.save(task);

    // كل مهمة جديدة تزيد إجمالي "مهام اليوم" — القرار: نعتبرها جزء
    // من إحصائية يوم الإنشاء بغض النظر عن due_date (شريط التقدم
    // بالدراسة قسم 2.3.1 يحسب "مهام اليوم" على أساس النشاط اليومي).
    await this.dailyStatsService.incrementTotal(userId);

    return saved;
  }

  /**
   * جلب مهام المستخدم مع الفلاتر (قسم 2.2.2) — يدعم دمج أكثر من
   * فلتر معًا (status + priority + categoryIds) عبر بناء WHERE
   * تراكمي، تمامًا حسب "يمكن دمج أكثر من فلتر معًا" بالدراسة.
   */
  async findAllForUser(userId: string, filter: FilterTasksDto): Promise<Task[]> {
    const qb = this.tasksRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.category', 'category')
      .where('task.user_id = :userId', { userId });

    switch (filter.status) {
      case TaskStatusFilter.TODAY:
        qb.andWhere('task.due_date = CURRENT_DATE');
        break;
      case TaskStatusFilter.PENDING:
        qb.andWhere('task.is_completed = false');
        break;
      case TaskStatusFilter.COMPLETED:
        qb.andWhere('task.is_completed = true');
        break;
      case TaskStatusFilter.ALL:
      default:
        break; // بدون شرط إضافي — كل المهام
    }

    if (filter.priority) {
      qb.andWhere('task.priority = :priority', { priority: filter.priority });
    }

    if (filter.categoryIds && filter.categoryIds.length > 0) {
      qb.andWhere('task.category_id IN (:...categoryIds)', {
        categoryIds: filter.categoryIds,
      });
    }

    // يطابق idx_tasks_user_completed_order — ترتيب متوقع ومفهرس
    qb.orderBy('task.isCompleted', 'ASC').addOrderBy('task.orderIndex', 'ASC');

    return qb.getMany();
  }

  /** جلب مهمة واحدة مع التأكد من الملكية — أي محاولة وصول لمهمة مستخدم آخر ترجع 404 */
  async findOneForUser(userId: string, taskId: string): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id: taskId, userId },
      relations: ['category'],
    });

    if (!task) {
      throw new NotFoundException('المهمة غير موجودة');
    }

    return task;
  }

  /**
   * دالة داخلية بلا فحص ملكية صارم على مستوى الإرجاع (تُستخدم من
   * PomodoroSessionsService للتأكد فقط إنه المهمة موجودة ومملوكة
   * للمستخدم قبل ربط جلسة فيها) — نفس منطق findAccessibleOrThrow
   * بـ CategoriesService.
   */
  async findAccessibleOrThrow(userId: string, taskId: string): Promise<Task> {
    return this.findOneForUser(userId, taskId);
  }

  /**
   * تعديل مهمة (قسم 2.1.3) — لا يلمس isCompleted/completedAt أبدًا
   * (لهم Endpoint منفصل toggleComplete بمنطق خاص فيهم).
   */
  async update(userId: string, taskId: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOneForUser(userId, taskId);

    if (dto.categoryId) {
      await this.categoriesService.findAccessibleOrThrow(userId, dto.categoryId);
    }

    Object.assign(task, dto);
    return this.tasksRepository.save(task);
  }

  /**
   * تبديل حالة الإكمال (Toggle، قسم 2.1.2) — العملية الوحيدة يلي
   * بتلمس is_completed/completed_at، وبتفرض التناسق بينهم يدويًا
   * بمستوى التطبيق (بالإضافة لـ CHECK constraint بمستوى القاعدة
   * كخط دفاع ثاني). كل تبديل بيحدّث daily_stats كمان بنفس الوقت.
   */
  async toggleComplete(userId: string, taskId: string): Promise<Task> {
    const task = await this.findOneForUser(userId, taskId);

    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;

    const saved = await this.tasksRepository.save(task);

    if (task.isCompleted) {
      await this.dailyStatsService.incrementCompleted(userId);
    } else {
      await this.dailyStatsService.decrementCompleted(userId);
    }

    return saved;
  }

  /** حذف مهمة (Hard Delete نهائي، قسم 2.1.3 — بتأكيد من الـ Frontend مسبقًا) */
  async remove(userId: string, taskId: string): Promise<void> {
    const task = await this.findOneForUser(userId, taskId);
    await this.tasksRepository.remove(task);
    await this.dailyStatsService.decrementTotal(userId, task.isCompleted);
  }

  /**
   * إعادة ترتيب مجمّعة (Batching، قسم 2.1.4 و4.2) — تنفيذ حرفي
   * لتوصية الدراسة: "تجميع عمليات إعادة الترتيب في طلب واحد" عبر
   * Transaction واحدة (QueryRunner) تحدّث كل order_index دفعة وحدة،
   * تمامًا حسب Transaction Pattern بملف AGENTS.md.
   */
  async reorder(userId: string, dto: ReorderTasksDto): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const item of dto.items) {
        const result = await queryRunner.manager
          .createQueryBuilder()
          .update(Task)
          .set({ orderIndex: item.orderIndex })
          .where('id = :id AND user_id = :userId', { id: item.id, userId })
          .execute();

        // لو ولا صف اتحدّث، معناها المهمة مو ملك هذا المستخدم —
        // نرفض العملية بالكامل (Rollback) بدل ما نكمل جزئيًا
        if (result.affected === 0) {
          throw new ForbiddenException(
            `المهمة ${item.id} غير موجودة أو لا تملك صلاحية تعديلها`,
          );
        }
      }

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
