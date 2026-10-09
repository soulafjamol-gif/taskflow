import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  @MinLength(1, { message: 'اسم التصنيف مطلوب' })
  @MaxLength(50)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'اللون يجب أن يكون بصيغة Hex صحيحة مثل #6366F1',
  })
  color: string;
}
