import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule, ObserveInstrument } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    instrument: ObserveInstrument,
  });

  // كان مفقودًا بالكامل — بدونه، كل الـ class-validator decorators
  // بكل الـ DTOs (CreateTaskDto, FilterTasksDto...) لا تُفعَّل أبدًا،
  // لأن NestJS لا يفحص الـ Body/Query تلقائيًا بدون Pipe عالمي مسجّل.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // يحذف أي حقل غير معرّف بالـ DTO (حماية إضافية)
      forbidNonWhitelisted: true, // يرفض الطلب لو فيه حقل زائد غير متوقع
      transform: true, // يفعّل class-transformer (مطلوب لـ FilterTasksDto وغيره)
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
