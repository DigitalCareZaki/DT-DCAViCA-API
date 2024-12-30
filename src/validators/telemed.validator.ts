import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { isUUID } from 'class-validator';

const allowedTypes = ['OFFLINE', 'ONLINE'];
const allowedAbout = ['EMERGENCY', 'CONSULTANCY', 'CHECKUP', 'CASUAL'];
const allowedStatus = [
  'HOLD',
  'CANCELLED',
  'ONGOING',
  'ACTIVE',
  'COMPLETED',
  'PENDING',
];

@ValidatorConstraint({ name: 'allowedTelemedType' })
export class ValidateTelemedType implements ValidatorConstraintInterface {
  validate(value: string): boolean | Promise<boolean> {
    return allowedTypes.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid appointment type, allowed types are ${allowedTypes.toString()}`;
  }
}

@ValidatorConstraint({ name: 'allowedTelemedStatus' })
export class ValidateTelemedStatus implements ValidatorConstraintInterface {
  validate(value: string): Promise<boolean> | boolean {
    return allowedStatus.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid appointment status, allowed status are ${allowedStatus.toString()}`;
  }
}

@ValidatorConstraint({ name: 'allowedTelemedAbout' })
export class ValidateTelemedAbout implements ValidatorConstraintInterface {
  validate(value: string): boolean | Promise<boolean> {
    return allowedAbout.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid appointment about, allowed abouts are ${allowedAbout.toString()}`;
  }
}

@ValidatorConstraint({ name: 'allowedUserId' })
export class ValidateUserId implements ValidatorConstraintInterface {
  validate(value: string[]): boolean | Promise<boolean> {
    try {
      if (!value?.length) return false;

      value.forEach((val) => {
        if (!isUUID(val)) {
          throw new Error('Invalid user id');
        }

        return true;
      });

      return true;
    } catch (err) {
      return false;
    }
  }

  defaultMessage(): string {
    return 'Users array Invalid user id';
  }
}
