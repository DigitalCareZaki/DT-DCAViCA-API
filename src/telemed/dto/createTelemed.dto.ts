import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator';
import {
  ValidateTelemedAbout,
  ValidateTelemedType,
  ValidateUserId,
} from 'src/validators';
import type { AppointmentType, AppointmentAbout } from '@prisma/client';

export class TelemedCreateDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsDateString()
  @IsNotEmpty()
  start_date: string;

  @IsDateString()
  @IsNotEmpty()
  end_date: string;

  @Validate(ValidateTelemedType)
  type: AppointmentType;

  @Validate(ValidateTelemedAbout)
  about: AppointmentAbout;

  @Validate(ValidateUserId)
  users: string[];
}
