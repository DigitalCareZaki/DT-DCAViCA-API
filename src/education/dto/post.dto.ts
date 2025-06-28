import { IsNotEmpty, IsOptional, IsString, Validate } from 'class-validator';
import { ValidateAdditionalUri, ValidateRefrences } from 'src/validators';

export class PostDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsNotEmpty()
  uri: string;

  @IsOptional()
  @Validate(ValidateAdditionalUri)
  additional_uri: Array<string>;

  @IsOptional()
  @Validate(ValidateRefrences)
  refrence: Array<string>;
}
