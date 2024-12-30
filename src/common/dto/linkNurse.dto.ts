import { IsNotEmpty, IsString } from 'class-validator';

export class LinkNurseDTO {
  @IsString()
  @IsNotEmpty()
  patient_id: string;

  @IsString()
  @IsNotEmpty()
  nurse_id: string;
}
