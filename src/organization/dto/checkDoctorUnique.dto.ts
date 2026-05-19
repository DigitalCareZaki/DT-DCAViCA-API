import { IsOptional, IsString } from 'class-validator';

export class CheckDoctorUniqueDTO {
  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsOptional()
  @IsString()
  npi_number?: string;

  @IsOptional()
  @IsString()
  pmdc_number?: string;
}
