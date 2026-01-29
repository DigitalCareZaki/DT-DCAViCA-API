import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';

import { AddUserBaseDTO } from './addUser.dto';

export enum VivalinkSyncStatusDTO {
  YES = 'YES',
  NO = 'NO',
  LATER = 'LATER',
}

export class AddDoctoreDTO extends AddUserBaseDTO {
  @IsNotEmpty()
  @IsString()
  npi_number: string;

  @IsNotEmpty()
  @IsString()
  employee_id: string;

  @IsNotEmpty()
  @IsString()
  department_id: string;

  @IsOptional()
  @IsString()
  pmdc_number: string;

  @IsOptional()
  @IsEnum(VivalinkSyncStatusDTO)
  avicardia_monitoring?: VivalinkSyncStatusDTO;

  @IsOptional()
  @IsString()
  site_id?: string;
}