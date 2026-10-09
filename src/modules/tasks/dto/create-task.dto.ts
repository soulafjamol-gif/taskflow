import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { TaskPriority } from '../../../common/enums/task-priority.enum.js';

export class CreateTaskDto {
  @IsString()
  @MinLength(1, { message: 'عنوان المهمة مطلوب' })
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsUUID('4', { message: 'معرّف التصنيف غير صالح' })
  categoryId: string;

  @IsEnum(TaskPriority, { message: 'الأولوية يجب أن تكون high أو medium أو low' })
  priority: TaskPriority;

  @IsOptional()
  @IsDateString({}, { message: 'تاريخ الاستحقاق يجب أن يكون بصيغة YYYY-MM-DD' })
  dueDate?: string;
}
