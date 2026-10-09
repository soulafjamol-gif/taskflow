# TaskFlow Backend — نسخة مصححة

## قبل التشغيل

```bash
npm install
cp .env.example .env   # وعبّي القيم الحقيقية لقاعدة البيانات
npm run start:dev
```

**ملاحظة:** الاتصال بقاعدة البيانات (`TypeOrmModule.forRootAsync`) موجود
الآن بـ `app.module.ts`، بس ما في Migrations فعلية بعد — لازم تُبنى
بالخطوة الجاية (`npm run migration:generate` بعد ما تشغّل PostgreSQL
فعليًا وتضبط `.env`، أو نكتبها يدويًا سوا حسب ملف `taskflow_schema.sql`
الأصلي).

## أهم التصحيحات عن النسخة المرفوعة

راجع رسالتي بالمحادثة لتفاصيل كل نقطة — ملخص سريع:

1. أسماء كل ملفات الـ Entities كانت لا تطابق الـ imports (categories.entities.ts
   بدل category.entity.ts، إلخ) — صُححت جميعها لصيغة مفردة موحّدة.
2. مجلد `user_settings` (snake_case) → `user-settings` (kebab-case)
   لمطابقة باقي المشروع.
3. `app.controller.ts` و `app.service.ts` كانا مفقودين بالكامل — أُضيفا.
4. `TypeOrmModule.forRoot()` كان مفقودًا بالكامل — بدونه ولا Service
   كانت رح تشتغل. أُضيف عبر `config/typeorm.config.ts`.
5. `ValidationPipe` العالمي كان مفقودًا من `main.ts` — بدونه كل
   الـ class-validator decorators بالـ DTOs معطّلة فعليًا.
6. أسرار Hardcoded بـ `app.module.ts` (NestJS Observe) → صارت تُقرأ
   من `.env`.
7. كل الموديولات الستة صارت تسجّل `TypeOrmModule.forFeature()`
   وتصدّر (`exports`) الـ Service الخاص فيها للموديولات التانية
   يلي محتاجاها (Tasks ↔ Categories ↔ DailyStats ↔ PomodoroSessions
   ↔ UserSettings ↔ Users).

## الخطوات الباقية (غير منفذة بهاد التسليم — تحتاج قرارك)

- **Auth Module** (JWT Strategy, Guards, `@CurrentUser()` decorator،
  auth.controller/service) — غير موجود بالزيب الأصلي ولا بهاد
  التسليم. كل الـ Services جاهزة تستقبل `userId` كمعامل أول، فربطها
  بالـ Auth لاحقًا بسيط.
- **Controllers فعلية** (Endpoints حقيقية بدل الـ stubs الفاضية) —
  الـ Services جاهزة بالكامل، بس ما فيه أي Route بيستدعيها بعد.
- **TypeORM Migrations فعلية** لإنشاء الجداول على PostgreSQL.
- **Seed Data** للتصنيفات الافتراضية الخمسة (مطلوبة عشان
  `CategoriesService.remove()` يلاقي تصنيف "بدون تصنيف").
