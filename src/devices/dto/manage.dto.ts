import { IsString, IsArray, IsNotEmpty } from 'class-validator';

export class ManageDeviceDTO {
  @IsArray()
  @IsString({ each: true })
  patient_ids: string[];

  @IsNotEmpty()
  @IsString()
  device_id: string;
}
