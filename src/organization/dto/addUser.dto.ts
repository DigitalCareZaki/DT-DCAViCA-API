import { Gender, Title } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
  Validate,
} from 'class-validator';
import {
  ValidateUniqueEmail,
  ValidateUniquePhone,
  ValidateUserGenders,
  ValidateUserType,
} from 'src/validators';

export class AddUserBaseDTO {
  @IsEmail()
  @IsNotEmpty()
  @Validate(ValidateUniqueEmail)
  email: string;

  @IsNotEmpty()
  // @IsPhoneNumber()
  @Validate(ValidateUniquePhone)
  phone_number: string;

  @MaxLength(20)
  @IsNotEmpty()
  @Validate(ValidateUniqueEmail)
  username: string;

  @Validate(ValidateUserGenders)
  @IsNotEmpty()
  gender: Gender;

  @Validate(ValidateUserType)
  @IsNotEmpty()
  title: Title;

  @IsNotEmpty()
  @IsStrongPassword()
  password: string;

  @MaxLength(15)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsOptional()
  @MaxLength(15)
  middle_name: string;

  @MaxLength(15)
  @MinLength(3)
  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @IsNotEmpty()
  @IsString()
  branch_id: string;

  @IsNotEmpty()
  @IsString()
  city_id: string;

  @IsNotEmpty()
  @IsString()
  country_id: string;

  @IsNotEmpty()
  @IsString()
  address: string;
}
