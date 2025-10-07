import { IsString, IsNotEmpty, IsUrl, Validate } from 'class-validator';

import { ValidateVideoPriority, ValidateVideoCategory, ValidateMeasurementType } from 'src/validators';

export class AddSuperadminVideosDTO {
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
  @Validate(ValidateMeasurementType)
  category: string;
  @IsString()
  @IsNotEmpty()
  branch_id: string;
}
