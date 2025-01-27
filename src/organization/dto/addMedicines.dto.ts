import { IsArray, IsString, ArrayMinSize } from 'class-validator';

export class AddMedicinesDTO {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1, { message: 'At least one medicine is required' })
  names: string[];
}
