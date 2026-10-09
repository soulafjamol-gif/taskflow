import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, Repository } from 'typeorm';
import { Category } from './entities/category.entity.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

/** اسم تصنيف "بدون تصنيف" الافتراضي — قرار Phase 3/4 لسياسة RESTRICT */
const UNCATEGORIZED_NAME = 'بدون تصنيف';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepository: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * يرجّع التصنيفات الافتراضية (user_id IS NULL) + تصنيفات هذا
   * المستخدم المخصصة معًا — هذا بالضبط ما تحتاجه شاشة "الشريط
   * الجانبي" (قسم 2.2.1 بالدراسة).
   */
  async findAllForUser(userId: string): Promise<Category[]> {
    return this.categoriesRepository
      .createQueryBuilder('category')
      .where('category.user_id IS NULL')
      .orWhere('category.user_id = :userId', { userId })
      .orderBy('category.isCustom', 'ASC') // الافتراضية أول، بعدين المخصصة
      .addOrderBy('category.createdAt', 'ASC')
      .getMany();
  }

  /**
   * دالة داخلية تستخدمها موديولات تانية (TasksService) للتأكد إنه
   * تصنيف معيّن يقدر هذا المستخدم يستخدمه فعليًا: إما افتراضي
   * مشترك، أو مخصص وملكه هو. هذا بديل عن حقن Repository<Category>
   * مباشرة بموديول تاني (احترامًا لقاعدة "Import modules, not
   * direct service dependencies" بملف AGENTS.md).
   */
  async findAccessibleOrThrow(userId: string, categoryId: string): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    const isDefault = category.userId === null;
    const isOwner = category.userId === userId;

    if (!isDefault && !isOwner) {
      throw new ForbiddenException('لا تملك صلاحية استخدام هذا التصنيف');
    }

    return category;
  }

  /** إنشاء تصنيف مخصص — isCustom = true دائمًا، userId من التوكن فقط */
  async create(userId: string, dto: CreateCategoryDto): Promise<Category> {
    const category = this.categoriesRepository.create({
      ...dto,
      userId,
      isCustom: true,
    });
    return this.categoriesRepository.save(category);
  }

  /**
   * تعديل تصنيف — مسموح فقط لو كان مخصصًا (isCustom) ومملوكًا لنفس
   * المستخدم. تعديل تصنيف افتراضي عبر API عادي غير مسموح إطلاقًا.
   */
  async update(userId: string, categoryId: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    if (!category.isCustom || category.userId !== userId) {
      throw new ForbiddenException('لا يمكن تعديل تصنيف غير مملوك لك أو تصنيف افتراضي');
    }

    Object.assign(category, dto);
    return this.categoriesRepository.save(category);
  }

  /**
   * حذف تصنيف مخصص — هذه أهم دالة بكل الـ Service، وتنفّذ حرفيًا
   * التصميم المتفق عليه (Phase 4 و6): بما إنه tasks.category_id
   * هو ON DELETE RESTRICT، أي محاولة حذف مباشر لتصنيف لسا مرتبطة
   * فيه مهام كانت رح ترفضها قاعدة البيانات. لذلك، جوا Transaction
   * واحدة:
   *   (1) نرحّل كل مهام هذا التصنيف لتصنيف "بدون تصنيف"
   *   (2) بعدين نحذف التصنيف، وهلق صار فاضي فـ RESTRICT رح يسمح
   *
   * QueryRunner + commit/rollback/finally بالضبط حسب نمط
   * AGENTS.md (Transaction Pattern).
   */
  async remove(userId: string, categoryId: string): Promise<void> {
    const category = await this.categoriesRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('التصنيف غير موجود');
    }

    if (!category.isCustom || category.userId !== userId) {
      throw new ForbiddenException('لا يمكن حذف تصنيف غير مملوك لك أو تصنيف افتراضي');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const uncategorized = await queryRunner.manager.findOne(Category, {
        where: { name: UNCATEGORIZED_NAME, userId: IsNull() },
      });

      if (!uncategorized) {
        // خط دفاع إضافي: لو الـ Seed Data ما اتنفذ لأي سبب
        throw new NotFoundException(
          'تصنيف "بدون تصنيف" الافتراضي غير موجود بقاعدة البيانات — راجع الـ Seed Data',
        );
      }

      await queryRunner.manager
        .createQueryBuilder()
        .update('tasks')
        .set({ categoryId: uncategorized.id })
        .where('category_id = :categoryId', { categoryId })
        .execute();

      await queryRunner.manager.delete(Category, { id: categoryId });

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
