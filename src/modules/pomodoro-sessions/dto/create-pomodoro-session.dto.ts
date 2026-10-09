import { IsOptional, IsUUID, IsInt, Min } from 'class-validator';

export class CreatePomodoroSessionDto {
  @IsOptional()
  @IsUUID('4', { message: 'معرّف المهمة غير صالح' })
  taskId?: string;

  @IsOptional()
  @IsInt({ message: 'المدة يجب أن تكون رقمًا صحيحًا بالثواني' })
  @Min(1)
  durationSeconds?: number;
}
