import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class DepartmentDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  branch_id: string;

  @IsString()
  @IsNotEmpty()
  city_id: string;

  @IsString()
  @IsOptional()
  zipcode: string;

  @IsString()
  @IsNotEmpty()
  address: string;
}
