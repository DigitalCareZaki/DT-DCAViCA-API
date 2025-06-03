import { IsArray, IsString, ArrayMinSize, IsNotEmpty } from 'class-validator';

export class AddMedicinesDTO {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one medicine is required' })
  names: string[];
}

export class AddMedicineDTO {
  @IsNotEmpty()
  @IsString()
  name: string;
}
