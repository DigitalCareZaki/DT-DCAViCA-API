import { IsString, IsOptional, IsNotEmpty, Validate, IsEnum } from 'class-validator';
import { ValidateMeasurementType } from 'src/validators';
import { VivalinkSyncStatusDTO } from 'src/organization/dto/addDoctor.dto';

export class DeviceDTO {
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

  @IsOptional()
  @IsString()
  site_id?: string;

  @IsOptional()
  @IsEnum(VivalinkSyncStatusDTO)
  cardiac_monitoring?: VivalinkSyncStatusDTO;
}