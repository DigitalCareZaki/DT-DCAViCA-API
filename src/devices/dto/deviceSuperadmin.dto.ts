import { IsString, IsOptional, IsNotEmpty, Validate } from 'class-validator';
import { ValidateMeasurementType } from 'src/validators';

export class DeviceSuperAdminDTO {
  // @IsNotEmpty()
  // @IsString()
  // patient_id: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsString()
  description: string | null;

  @IsNotEmpty()
  @IsString()
  serial_number: string;

  @IsOptional()
  @IsString()
  uri: string;

  @IsNotEmpty()
  @IsString()
  @Validate(ValidateMeasurementType)
  category: string;

  @IsString()
  @IsNotEmpty()
  branch_id: string;
}
