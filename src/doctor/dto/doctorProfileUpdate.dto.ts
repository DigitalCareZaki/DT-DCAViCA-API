import { IsOptional, IsString, Validate } from 'class-validator';
import { ValidateUserType } from 'src/validators';

export class DoctorProfileUpdateDto {
  @Validate(ValidateUserType)
  title: any;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsString()
  middle_name: string;

  @IsString()
  address: string;

  @IsString()
  phone_number: string;

  @IsString()
  @IsOptional()
  uri: string;
}
