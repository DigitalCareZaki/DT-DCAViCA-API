import { EMRType } from '@prisma/client';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class EMR_DTO {
  @IsString()
  @IsNotEmpty()
  patient_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  uri: string;

  @IsString()
  @IsOptional()
  description: string;

  @IsString()
  type: EMRType;
}
