import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSettingsController } from './user-settings.controller.js';
import { UserSettingsService } from './user-settings.service.js';
import { UserSettings } from './entities/user-settings.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([UserSettings])],
  controllers: [UserSettingsController],
  providers: [UserSettingsService],
  exports: [UserSettingsService], // لازم export — UsersModule محتاجه
})
export class UserSettingsModule {}
