import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsPhoneNumber,
  IsString,
} from 'class-validator';

export class ContactDTO {
  @IsEmail()
  @IsOptional()
  email: string;

  @IsNotEmpty()
  @IsPhoneNumber()
  number: string;

  @IsNotEmpty()
  @IsString()
  relationship: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}
