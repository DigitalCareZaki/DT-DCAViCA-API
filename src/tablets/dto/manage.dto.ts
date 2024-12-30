import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class ManageTabletDTO {
  @IsArray()
  @IsString({ each: true })
  patient_ids: string[];

  @IsNotEmpty()
  @IsString()
  tablet_id: string;
}
