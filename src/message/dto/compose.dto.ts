import { IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';
import { ValidateAdditionalUri } from 'src/validators';

export class ComposeDTO {
  // Accept either an email or a user id (uuid/cuid)
  @IsString()
  @IsNotEmpty()
  send_to: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsOptional()
  @IsString()
  parent_id: string;



  @Validate(ValidateAdditionalUri)
  attachments: string[];
}
