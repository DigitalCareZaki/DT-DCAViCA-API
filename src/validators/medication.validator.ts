import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

const MedicationUnitArray = [
  'TABLET',
  'CAPSULE',
  'SOFTGEL',
  'TEASPOON',
  'TABLESPOON',
];

const MedicationAlertTakenArray = ['TAKEN', 'NOT_TAKEN'];

@ValidatorConstraint({ name: 'validateStartDateNotInPast' })
export class ValidateStartDateNotInPast implements ValidatorConstraintInterface {
  validate(
    value: string,
    args: ValidationArguments,
  ): boolean | Promise<boolean> {
    // console.log('valdateStartDateNotInPast ran');

    const object = args.object as any;
    const { start_date } = object;

    // no need, as @Transform runs before @Validate
    // for autocomplete
    const startDate = new Date(start_date);
    const now = new Date();

    // console.log(
    //   'now After',
    //   new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    // );

    // const localStartDate = new Date(
    //   startDate.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
    // );
    // console.log(
    //   'localStartDateString',
    //   startDate.toLocaleString('en-US', { timeZone: 'Asia/Karachi' }),
    // );
    // console.log('localStartDateDate', localStartDate);

    return (
      new Date(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      ) >= new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // return startDate >= now;
  }

  defaultMessage(): string {
    return 'start_date should not be in the past';
  }
}

@ValidatorConstraint({ name: 'validateEndDateGreaterThanStartDate' })
export class ValidateEndDateGreaterThanStartDate
  implements ValidatorConstraintInterface {
  validate(
    value: string,
    args: ValidationArguments,
  ): boolean | Promise<boolean> {
    const object = args.object as any;
    const { start_date, end_date } = object;

    const startDate = new Date(start_date);
    const endDate = new Date(end_date);

    return (
      new Date(
        endDate.getUTCFullYear(),
        endDate.getUTCMonth(),
        endDate.getUTCDate(),
      ) >=
      new Date(
        startDate.getUTCFullYear(),
        startDate.getUTCMonth(),
        startDate.getUTCDate(),
      )
    );
  }

  defaultMessage(): string {
    return 'end_date should be greater than start date';
  }
}

@ValidatorConstraint({ name: 'validateMedicationUnit' })
export class ValidateMedicationUnit implements ValidatorConstraintInterface {
  validate(value: any): boolean | Promise<boolean> {
    return MedicationUnitArray.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid medication unit, allowed unit are ${MedicationUnitArray.toString()}`;
  }
}

@ValidatorConstraint({ name: 'validateMedicationAlertTaken' })
export class ValidateMedicationAlertTaken
  implements ValidatorConstraintInterface {
  validate(value: any): boolean | Promise<boolean> {
    return MedicationAlertTakenArray.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid medication alert taken, allowed unit are ${MedicationAlertTakenArray.toString()}`;
  }
}
