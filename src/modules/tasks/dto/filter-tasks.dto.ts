import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { TaskPriority } from '../../../common/enums/task-priority.enum.js';
import { TaskStatusFilter } from '../../../common/enums/task-status-filter.enum.js';

export class FilterTasksDto {
  @IsOptional()
  @IsEnum(TaskStatusFilter, { message: 'status غير صالح' })
  status?: TaskStatusFilter;

  @IsOptional()
  @IsEnum(TaskPriority, { message: 'priority غير صالح' })
  priority?: TaskPriority;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && value.length > 0) {
      return value.split(',').map((v) => v.trim());
    }
    return value;
  })
  @IsUUID('4', { each: true, message: 'كل معرّف تصنيف يجب أن يكون UUID صالحًا' })
  categoryIds?: string[];
}
