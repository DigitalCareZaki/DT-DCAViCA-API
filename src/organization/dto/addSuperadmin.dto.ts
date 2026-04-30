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

export class AddSuperadminDTO {
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

  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsOptional()
  middle_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsDateString()
  @IsNotEmpty()
  dob: string;

  @IsNotEmpty()
  @IsString()
  organization_id: string;

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
