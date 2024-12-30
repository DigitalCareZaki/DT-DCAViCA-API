import {
  IsString,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  Validate,
} from 'class-validator';
import {
  ValidateMeasurementType,
  ValidateMeasurementReadingRange,
} from 'src/validators';

export class ReadingRangeDTO {
  @IsNotEmpty()
  @IsString()
  patient_id: string;

  @IsNotEmpty()
  @IsString()
  @Validate(ValidateMeasurementType)
  type: string;

  @IsNotEmpty()
  @Validate(ValidateMeasurementReadingRange)
  @IsArray()
  range: Array<number>;

  @IsBoolean()
  send_sms: boolean;

  @IsBoolean()
  send_email: boolean;
}
