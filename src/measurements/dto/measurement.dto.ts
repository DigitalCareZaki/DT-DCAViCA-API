import {
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';

import {
  ValidateMeasurementType,
  ValidateMeasurementMode,
  ValidateMeasurementUnit,
  ValidateMeasurementValuesNumberArray,
  ValidateMeasurementUnitForType,
  ValidateMeasurementReadingSource,
} from 'src/validators';

export class MeasurementDTO {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  title: string;

  @IsNotEmpty()
  @IsString()
  @Validate(ValidateMeasurementType)
  type: string;

  @IsNotEmpty()
  @IsString()
  @Validate(ValidateMeasurementMode)
  mode: string;

  @IsNotEmpty()
  @IsString()
  @Validate(ValidateMeasurementUnit)
  @Validate(ValidateMeasurementUnitForType)
  unit: string;

  @IsString()
  @IsNotEmpty()
  @Validate(ValidateMeasurementReadingSource)
  reading_source: string;

  @IsNotEmpty()
  @Validate(ValidateMeasurementValuesNumberArray)
  @IsArray()
  @Transform(({ value }) => value.filter((val) => Number(val)))
  values: Array<number>;
}
