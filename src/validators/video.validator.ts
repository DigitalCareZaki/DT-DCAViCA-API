import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

const VideoPriorityArray = ['HIGH', 'LOW', 'UNDEFINED'];
const VideoCategoryArray = ['INFORMATIONAL', 'MARKETING'];

@ValidatorConstraint({ name: 'allowedVideoPriority' })
export class ValidateVideoPriority implements ValidatorConstraintInterface {
  validate(value: string): boolean | Promise<boolean> {
    return VideoPriorityArray.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid video priority, allowed values are ${VideoPriorityArray.toString()}`;
  }
}

@ValidatorConstraint({ name: 'allowedVideoCategory' })
export class ValidateVideoCategory implements ValidatorConstraintInterface {
  validate(value: any): boolean | Promise<boolean> {
    return VideoCategoryArray.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid video category, allowed values are ${VideoCategoryArray.toString()}`;
  }
}
