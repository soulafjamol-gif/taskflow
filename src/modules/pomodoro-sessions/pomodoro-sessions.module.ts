import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PomodoroSessionsController } from './pomodoro-sessions.controller.js';
import { PomodoroSessionsService } from './pomodoro-sessions.service.js';
import { PomodoroSession } from './entities/pomodoro-session.entity.js';
import { TasksModule } from '../tasks/tasks.module.js';

@Module({
  imports: [
    TypeOrmModule.forFeature([PomodoroSession]),
    TasksModule, // عشان نقدر نحقن TasksService (التحقق من ملكية المهمة)
  ],
  controllers: [PomodoroSessionsController],
  providers: [PomodoroSessionsService],
  exports: [PomodoroSessionsService],
})
export class PomodoroSessionsModule {}
