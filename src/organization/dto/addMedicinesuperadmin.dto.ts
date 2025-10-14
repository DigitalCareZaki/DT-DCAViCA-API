import { IsArray, IsString, ArrayMinSize, IsNotEmpty } from 'class-validator';

export class AddSuperAdminMedicinesDTO {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one medicine is required' })
  names: string[];
  @IsString()
  @IsNotEmpty()
  branch_id: string;
}

export class AddSuperAdminMedicineDTO {
  @IsNotEmpty()
  @IsString()
  name: string;
  @IsString()
  @IsNotEmpty()
  branch_id: string;
}
