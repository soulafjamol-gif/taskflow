import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller.js';
import { TasksService } from './tasks.service.js';
import { Task } from './entities/task.entity.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { DailyStatsModule } from '../daily-stats/daily-stats.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([Task]),
    CategoriesModule, // عشان نقدر نحقن CategoriesService بالـ TasksService
    DailyStatsModule, // عشان نقدر نحقن DailyStatsService بالـ TasksService
  ],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService], // لازم export — PomodoroSessionsModule محتاجه
})
export class TasksModule {}
