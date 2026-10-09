import { Type } from 'class-transformer';
import {
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';

class TaskOrderItemDto {
  @IsUUID('4', { message: 'معرّف المهمة غير صالح' })
  id: string;

  @IsInt({ message: 'الترتيب يجب أن يكون رقمًا صحيحًا' })
  @Min(0)
  orderIndex: number;
}

export class ReorderTasksDto {
  @IsArray()
  @ArrayMinSize(1, { message: 'يجب إرسال عنصر واحد على الأقل لإعادة الترتيب' })
  @ValidateNested({ each: true })
  @Type(() => TaskOrderItemDto)
  items: TaskOrderItemDto[];
}
