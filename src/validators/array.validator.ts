import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'allowedArrayNumberValue' })
export class ValidateArrayNumberValue implements ValidatorConstraintInterface {
  validate(value: Array<number>): boolean | Promise<boolean> {
    if (!value?.length || value?.length < 2) {
      return false;
    }

    if (value instanceof Array) {
      return value?.every((val) => typeof val === 'number');
    }

    return false;
  }

  defaultMessage(): string {
    return 'Invalid values, values must be an array of numbers';
  }
}

@ValidatorConstraint({ name: 'allowedAdditionalUri' })
export class ValidateAdditionalUri implements ValidatorConstraintInterface {
  validate(value: Array<string>): boolean | Promise<boolean> {
    if (value !== undefined && typeof value === 'object' && value.length) {
      return true;
    }

    if (value instanceof Array) {
      return value?.every((val) => typeof val === 'string');
    }

    return false;
  }

  defaultMessage(): string {
    return 'Invalid "additional_uri" array, "additional_uri" values should be like this ["uri", "uri"] ';
  }
}

@ValidatorConstraint({ name: 'allowedRefrences' })
export class ValidateRefrences implements ValidatorConstraintInterface {
  validate(value: Array<string>): boolean | Promise<boolean> {
    if (value !== undefined && typeof value === 'object' && value.length) {
      return true;
    }

    if (value instanceof Array) {
      return value?.every((val) => typeof val === 'string');
    }

    return false;
  }

  defaultMessage(): string {
    return 'Invalid "refrence" array, "refrence" values should be like this ["uri", "uri"] ';
  }
}
