import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class MailDTO {
  @IsNotEmpty()
  @IsEmail()
  to: string[];

  @IsNotEmpty()
  @IsString()
  subject: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}
