import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * إعدادات الاتصال بـ PostgreSQL — Factory Pattern حسب AGENTS.md.
 *
 * ملاحظة مهمة: synchronize: false دائمًا — نلتزم بقاعدة "Always
 * use migrations, never synchronize". أي تغيير على الـ Schema
 * لازم يمر عبر ملف Migration صريح (سيُبنى بالمرحلة القادمة)، مش
 * يعتمد على TypeORM يعدّل الجداول تلقائيًا خلف الكواليس.
 */
export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'taskflow',
    autoLoadEntities: true, // يحمّل كل Entity مسجّلة عبر TypeOrmModule.forFeature تلقائيًا
    synchronize: false,
    logging: process.env.NODE_ENV !== 'production',
  }),
);
