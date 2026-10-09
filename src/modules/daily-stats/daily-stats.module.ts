import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyStatsController } from './daily-stats.controller.js';
import { DailyStatsService } from './daily-stats.service.js';
import { DailyStat } from './entities/daily-stat.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([DailyStat])],
  controllers: [DailyStatsController],
  providers: [DailyStatsService],
  exports: [DailyStatsService], // لازم export — TasksModule محتاجه
})
export class DailyStatsModule {}
