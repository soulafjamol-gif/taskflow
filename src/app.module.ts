import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UsersModule } from './modules/users/users.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { UserSettingsModule } from './modules/user-settings/user-settings.module.js';
import { PomodoroSessionsModule } from './modules/pomodoro-sessions/pomodoro-sessions.module.js';
import { CategoriesModule } from './modules/categories/categories.module.js';
import { DailyStatsModule } from './modules/daily-stats/daily-stats.module.js';
import typeormConfig from './config/typeorm.config.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    // ConfigModule عالمي — يحمّل .env مرة وحدة ويوفره لكل الموديولات
    // عبر ConfigService، بدل ما كل ملف يقرأ process.env مباشرة.
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeormConfig],
    }),

    // كان مفقودًا بالكامل بالملف الأصلي — بدون هذا، أي
    // TypeOrmModule.forFeature() بأي موديول كان رح يفشل عند
    // الإقلاع لأنه ما في اتصال قاعدة بيانات مسجّل أصلًا.
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),

    // كانت القيم هون Hardcoded ('YOUR_APP_KEY' / 'YOUR_APP_SECRET') —
    // هذا يخالف قاعدة "Never commit secrets or credentials" بملف
    // AGENTS.md. صُححت لتُقرأ من متغيرات البيئة، تمامًا كما توثّق
    // NestJS Observe نفسها بمثالها الرسمي. لو ما بدك تستخدم هذه
    // الخدمة إطلاقًا، احذف هذا الاستيراد بالكامل من app.module.ts.
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY,
      appSecret: process.env.OBSERVE_APP_SECRET,
      serviceId: 'taskflow1',
    }),

    UsersModule,
    TasksModule,
    UserSettingsModule,
    PomodoroSessionsModule,
    CategoriesModule,
    DailyStatsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
