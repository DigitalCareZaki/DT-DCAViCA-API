import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { AddUserBaseDTO } from './addUser.dto';

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
}
