import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';

export class SupportDTO {
  @IsNotEmpty()
  @IsBoolean()
  forgot_password: boolean;

  @IsNotEmpty()
  @IsBoolean()
  not_signing_up: boolean;

  @IsNotEmpty()
  @IsBoolean()
  can_not_find_anything: boolean;

  @IsNotEmpty()
  @IsBoolean()
  showing_errors: boolean;

  @IsNotEmpty()
  @IsBoolean()
  others: boolean;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  textarea: string;
}
