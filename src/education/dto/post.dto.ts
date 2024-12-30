import { IsNotEmpty, IsString, Validate } from 'class-validator';
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

  @Validate(ValidateAdditionalUri)
  additional_uri: Array<string>;

  @Validate(ValidateRefrences)
  refrence: Array<string>;
}
