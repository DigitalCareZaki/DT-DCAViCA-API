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

function getDate(value: string): Date {
  const date = new Date(value);

  // Subtract 5 hours from date
  date.setUTCHours(date.getUTCHours() - 5, 0, 0, 0); // Reset time to midnight in UTC

  console.log('date >>>>>>>>>>', date);
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
  @Transform(({ value }: { value: string }) => getDate(value))
  start_date: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  // @Validate(ValidateEndDateGreaterThanStartDate)
  @Transform(({ value }: { value: string }) => getDate(value))
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
