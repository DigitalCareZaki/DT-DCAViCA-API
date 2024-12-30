import { AppointmentStatus } from '@prisma/client';
import { IsNotEmpty, IsUUID, Validate } from 'class-validator';
import { ValidateTelemedStatus } from 'src/validators';

export class TelemedActionDTO {
  @IsNotEmpty()
  @IsUUID()
  id: string;

  @Validate(ValidateTelemedStatus)
  status: AppointmentStatus;
}
