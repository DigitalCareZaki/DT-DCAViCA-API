import { IsNotEmpty, IsString, Validate } from 'class-validator';
import { ValidateMedicationAlertTaken } from 'src/validators';

export class PatientMedicationAlertDTO {
  @IsString()
  @IsNotEmpty()
  @Validate(ValidateMedicationAlertTaken)
  taken: string;
}
