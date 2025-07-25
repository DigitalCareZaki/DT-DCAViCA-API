import { Type, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsString,
  IsDate,
  IsNumber,
  IsOptional,
  IsISO8601,
  Validate,
  IsArray,
  Matches,
} from 'class-validator';
import {
  ValidateMedicationUnit,
  ValidateStartDateNotInPast,
  ValidateEndDateGreaterThanStartDate,
} from 'src/validators';

function startDateTransform(value: string): Date {
  const date = new Date(value);

  // subtract 5 hours to adjust for timezone
  date.setHours(date.getHours() - 5);

  return date;
}

function endDateTransform(value: string): Date {
  const date = new Date(value);

  // subtract 5 hours to adjust for timezone
  date.setHours(date.getHours() - 5);

  // add 23 hours, 59 minutes, and 59 seconds to set the time to the end of the day
  date.setHours(date.getHours() + 23, date.getMinutes() + 59, date.getSeconds() + 59);

  return date;
}

// @Transform runs before @Validate
// Therefore dates will always be in the following format
// YYYY-MM-DDT00:00:00.000Z

export class MedicationDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  // @Validate(ValidateStartDateNotInPast)
  @Transform(({ value }: { value: string }) => startDateTransform(value))
  start_date: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  // @Validate(ValidateEndDateGreaterThanStartDate)
  @Transform(({ value }: { value: string }) => endDateTransform(value))
  end_date: string;

  // @IsISO8601()
  // @IsNotEmpty()
  // time: string;
  @IsArray()
  @IsString({ each: true })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, { each: true }) // ensures HH:MM format
  time: string[];

  @IsString()
  @IsNotEmpty()
  dosage: string;

  @IsNumber()
  @IsNotEmpty()
  frequency: number;

  @IsString()
  @IsNotEmpty()
  @Validate(ValidateMedicationUnit)
  unit: string;

  @IsOptional()
  @IsString()
  appointment_id: string;
}
