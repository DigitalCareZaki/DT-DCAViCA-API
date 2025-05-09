import { IsString, IsOptional, IsNotEmpty, Validate } from 'class-validator';


export class PatientDeviceDTO {


  @IsNotEmpty()
  @IsString()
  device_id: string;

  @IsNotEmpty()
  @IsString()
  issued_to: string | null;




}
