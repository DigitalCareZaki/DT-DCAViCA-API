import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

export class AddOrganizationDTO {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  city_id: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  website: string;

  @IsString()
  @IsOptional()
  uri: string;
}
