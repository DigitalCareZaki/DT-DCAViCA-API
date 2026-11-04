import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';

import { AddUserBaseDTO } from './addUser.dto';
import { VivalinkSyncStatusDTO } from './addDoctor.dto';

export class AddPatientDTO extends AddUserBaseDTO {
  @IsOptional()
  @IsString()
  doctor_id: string;

  @IsOptional()
  @IsString()
  nurse_id: string;

  @IsOptional()
  @IsNumber()
  weight: number;

  @IsOptional()
  @IsNumber()
  height: number;

  @IsOptional()
  @IsEnum(VivalinkSyncStatusDTO)
  cardiac_monitoring?: VivalinkSyncStatusDTO;

  @IsOptional()
  @IsString()
  site_id?: string;
  @IsOptional()
  @IsString()
  monitring_protocol_id?: string;
}