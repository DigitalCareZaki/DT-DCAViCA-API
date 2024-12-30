import {
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  Matches,
  Validate,
} from 'class-validator';
import {
  ValidatePasswordAtleastOneUppercaseLetter,
  ValidatePasswordAtleastOneLowerLetter,
  ValidatePasswordAtleastOneSpecialCharacter,
} from 'src/validators';

export class SetPincodeDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  @MinLength(6)
  @Matches(/^[0-9]+$/, { message: 'Pincode must contain only numbers' })
  pincode: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Invalid password' })
  @Validate(ValidatePasswordAtleastOneUppercaseLetter, {
    message: 'Invalid password',
  })
  @Validate(ValidatePasswordAtleastOneLowerLetter, {
    message: 'Invalid password',
  })
  @Validate(ValidatePasswordAtleastOneSpecialCharacter, {
    message: 'Invalid password',
  })
  password: string;
}

export class VerifyPincodeDTO {
  @IsString()
  @IsNotEmpty()
  @MaxLength(6)
  @MinLength(6)
  @Matches(/^[0-9]+$/, { message: 'Pincode must contain only numbers' })
  pincode: string;
}
