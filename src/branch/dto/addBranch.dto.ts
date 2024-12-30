import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import {
  ValidateBranchUniqueEmail,
  ValidateBranchUniquePhoneNumber,
} from 'src/validators';

export class AddBranchDTO {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  @Validate(ValidateBranchUniquePhoneNumber)
  phoneNumber: string;

  @IsEmail()
  @IsOptional()
  @Validate(ValidateBranchUniqueEmail)
  email: string;

  @IsNotEmpty()
  @IsString()
  address: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}
