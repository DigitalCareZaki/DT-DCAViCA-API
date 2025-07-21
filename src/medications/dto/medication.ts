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
  // console.log('Transform getDate ran');

  const date = new Date(value);
  // Subtract 5 hours from date
  date.setHours(date.getHours() - 5, 0, 0, 0);

  console.log('date >>>>>>>>>>', date);

  // console.log('date', date);
  // console.log('hours', date.getHours());
  // console.log('hours_utc', date.getUTCHours());

  // console.log(
  //   'test',
  //   new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  // );

  // console.log(
  //   'Transformed date',
  //   new Date(
  //     Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  //   ),
  // );
  // console.log(
  //   'Transform getDate .toString',
  //   new Date(
  //     Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  //   ).toString(),
  // );

  // console.log('date from Transform', date);
  return date;

  // return new Date(
  //   Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  // );
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
  @Validate(ValidateStartDateNotInPast)
  @Transform(({ value }: { value: string }) => getDate(value))
  start_date: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  @Validate(ValidateEndDateGreaterThanStartDate)
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
