import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserSettingsService } from '../user-settings/user-settings.service.js';

const BCRYPT_SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly userSettingsService: UserSettingsService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email, deletedAt: IsNull() },
    });

    if (existing) {
      throw new ConflictException('البريد الإلكتروني مستخدم مسبقًا');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_SALT_ROUNDS);

    const user = this.usersRepository.create({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    const saved = await this.usersRepository.save(user);
    await this.userSettingsService.createDefault(saved.id);

    return saved;
  }
  
  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .andWhere('user.deletedAt IS NULL')
      .getOne();
  }

  async findById(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }
    return user;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.update(id, { lastLoginAt: new Date() });
  }

  /**
   * حذف الحساب — Soft Delete (قرار متفق عليه بمرحلة Delete Strategy).
   * softRemove() من TypeORM بيحدّث deleted_at تلقائيًا عبر
   * @DeleteDateColumn، وكل استعلام find() عادي بعدها بيستثني هذا
   * الصف تلقائيًا بدون شرط WHERE يدوي.
   */
  async softDelete(id: string): Promise<void> {
    const user = await this.findById(id);
    await this.usersRepository.softRemove(user);
  }
}
