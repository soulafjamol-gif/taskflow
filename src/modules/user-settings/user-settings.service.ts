import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserSettings } from './entities/user-settings.entity.js';
import { UpdateUserSettingsDto } from './dto/update-user-settings.dto.js';

@Injectable()
export class UserSettingsService {
  constructor(
    @InjectRepository(UserSettings)
    private readonly userSettingsRepository: Repository<UserSettings>,
  ) {}

  /**
   * تُستدعى من UsersService عند تسجيل حساب جديد — لا يوجد
   * CreateUserSettingsDto عام لأنه هذا الصف لا يُنشأ إلا تلقائيًا
   * مرة واحدة بالضبط لكل مستخدم (علاقة 1:1 حقيقية)، بقيم افتراضية
   * مطابقة لما هو معرّف بالـ Entity نفسها.
   */
  async createDefault(userId: string): Promise<UserSettings> {
    const settings = this.userSettingsRepository.create({ userId });
    return this.userSettingsRepository.save(settings);
  }

  async findByUser(userId: string): Promise<UserSettings> {
    const settings = await this.userSettingsRepository.findOne({
      where: { userId },
    });

    if (!settings) {
      throw new NotFoundException('إعدادات المستخدم غير موجودة');
    }

    return settings;
  }

  async update(userId: string, dto: UpdateUserSettingsDto): Promise<UserSettings> {
    const settings = await this.findByUser(userId);
    Object.assign(settings, dto);
    return this.userSettingsRepository.save(settings);
  }
}
