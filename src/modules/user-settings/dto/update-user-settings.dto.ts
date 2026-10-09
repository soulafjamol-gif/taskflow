import { IsOptional, IsEnum, IsInt, IsBoolean, Min } from 'class-validator';
import { ThemeMode } from '../../../common/enums/theme-mode.enum.js';

export class UpdateUserSettingsDto {
  @IsOptional()
  @IsEnum(ThemeMode, { message: 'theme يجب أن يكون light أو dark' })
  theme?: ThemeMode;

  @IsOptional()
  @IsInt()
  @Min(1)
  pomodoroWorkDuration?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  pomodoroBreakDuration?: number;

  @IsOptional()
  @IsBoolean()
  pomodoroAutoStart?: boolean;

  @IsOptional()
  @IsBoolean()
  pomodoroSoundEnabled?: boolean;
}
