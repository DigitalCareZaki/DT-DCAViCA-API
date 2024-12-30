import { IsNotEmpty, IsString } from 'class-validator';

export class TelemedAssignPatientDTO {
  @IsString()
  @IsNotEmpty()
  user_id: string;

  @IsString()
  @IsNotEmpty()
  appointment_id: string;
}
