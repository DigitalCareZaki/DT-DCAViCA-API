import { IsString, IsNotEmpty, IsUrl, Validate } from 'class-validator';

import { ValidateVideoPriority, ValidateVideoCategory } from 'src/validators';

export class AddVideosDTO {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUrl()
  @IsNotEmpty()
  uri: string;

  @IsString()
  @IsNotEmpty()
  @Validate(ValidateVideoPriority)
  priority: string;

  @IsString()
  @IsNotEmpty()
  @Validate(ValidateVideoCategory)
  category: string;
}
