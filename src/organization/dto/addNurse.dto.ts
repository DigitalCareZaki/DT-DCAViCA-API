import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

import { AddUserBaseDTO } from './addUser.dto';

export class AddNurseDTO extends AddUserBaseDTO {
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
  site_id?: string;
}
