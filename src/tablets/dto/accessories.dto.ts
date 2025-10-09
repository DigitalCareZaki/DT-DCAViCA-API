import { IsString, IsOptional, IsNotEmpty, Validate } from 'class-validator';
import { ValidateMeasurementType } from 'src/validators';

export class AccessoriesDTO {
  @IsNotEmpty()
  @IsString()
  title: string;

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
