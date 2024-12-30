import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'passwordMustContainAtleastOneUppercaseLetter' })
export class ValidatePasswordAtleastOneUppercaseLetter
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean | Promise<boolean> {
    if (!value) return false;
    const regex = /[A-Z]/;
    return regex.test(value);
  }

  defaultMessage(): string {
    return 'Password must contain at least one uppercase letter';
  }
}

@ValidatorConstraint({ name: 'passwordMustContainAtleastOneLowerLetter' })
export class ValidatePasswordAtleastOneLowerLetter
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean | Promise<boolean> {
    if (!value) return false;
    const regex = /[a-z]/;
    return regex.test(value);
  }

  defaultMessage(): string {
    return 'Password must contain at least one lower letter';
  }
}

@ValidatorConstraint({ name: 'passwordMustContainAtleastOneSpecialCharacter' })
export class ValidatePasswordAtleastOneSpecialCharacter
  implements ValidatorConstraintInterface
{
  validate(value: string): boolean | Promise<boolean> {
    if (!value) return false;
    const regex = /[*.,!@#$%^&(){}\[\]:;<>\?\/\\~_+\-=|\]]/;
    return regex.test(value);
  }

  defaultMessage(): string {
    return 'Password must contain at least one special character';
  }
}
