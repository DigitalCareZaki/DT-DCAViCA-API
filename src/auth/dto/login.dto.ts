import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Validate,
} from 'class-validator';
import {
  ValidatePasswordAtleastOneUppercaseLetter,
  ValidatePasswordAtleastOneLowerLetter,
  ValidatePasswordAtleastOneSpecialCharacter,
} from 'src/validators';

export class LoginDTO {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'password must be 8 characters long' })
  @Validate(ValidatePasswordAtleastOneUppercaseLetter)
  @Validate(ValidatePasswordAtleastOneLowerLetter)
  @Validate(ValidatePasswordAtleastOneSpecialCharacter)
  password: string;
}
