import { IsNumber, IsOptional, IsString } from 'class-validator';

import { AddUserBaseDTO } from './addUser.dto';

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
}
