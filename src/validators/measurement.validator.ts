import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

import type { MeasurementType, MeasurementUnit } from '@prisma/client';

const MeasurementTypesArray = [
  'ECG',
  'SPO2',
  'BLOODPRESSURE',
  'BLOODGLUCOSE',
  'TEMPERATURE',
];
const MeasurementModeArr = ['METRIC'];
const MeasurementUnitArr = [
  'VOLTAGE',
  'PERCENTAGE',
  'MMHG',
  'MGDL',
  'FAHRENHEIT',
];
const MeasurementReadingSourceArray = ['AUTOMATIC', 'MANUAL'];

function getAcceptableUnitsBasedOnMeasurementType(
  type: MeasurementType,
): MeasurementUnit[] {
  if (type === 'ECG') {
    return ['VOLTAGE'];
  } else if (type === 'SPO2') {
    return ['PERCENTAGE'];
  } else if (type === 'BLOODPRESSURE') {
    return ['MMHG'];
  } else if (type === 'BLOODGLUCOSE') {
    return ['MGDL'];
  } else if (type === 'TEMPERATURE') {
    return ['FAHRENHEIT'];
  } else {
    return [];
  }
}

@ValidatorConstraint({ name: 'allowedMeasurementType' })
export class ValidateMeasurementType implements ValidatorConstraintInterface {
  validate(value: string): boolean | Promise<boolean> {
    return MeasurementTypesArray.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid measurement type, allowed types are ${MeasurementTypesArray.toString()}`;
  }
}

@ValidatorConstraint({ name: 'allowedMeasurementMode' })
export class ValidateMeasurementMode implements ValidatorConstraintInterface {
  validate(value: any): boolean | Promise<boolean> {
    return MeasurementModeArr.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid measurement mode, allowed mode are ${MeasurementModeArr.toString()}`;
  }
}

@ValidatorConstraint({ name: 'allowedMeasurementUnit' })
export class ValidateMeasurementUnit implements ValidatorConstraintInterface {
  validate(value: any): boolean | Promise<boolean> {
    return MeasurementUnitArr.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid measurement unit, allowed unit are ${MeasurementUnitArr.toString()}`;
  }
}

@ValidatorConstraint({ name: 'allowedMeasurementReadingSource' })
export class ValidateMeasurementReadingSource
  implements ValidatorConstraintInterface
{
  validate(value: any): boolean | Promise<boolean> {
    return MeasurementReadingSourceArray.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid medication reading source, allowed values are ${MeasurementReadingSourceArray.toString()}`;
  }
}

@ValidatorConstraint({ name: 'validateMeasurementValuesNumberArray' })
export class ValidateMeasurementValuesNumberArray
  implements ValidatorConstraintInterface
{
  validate(value: any, args: ValidationArguments): boolean | Promise<boolean> {
    const { type } = args.object as any;

    if (type === 'BLOODPRESSURE') {
      if (value?.length === 2) {
        false;
      }
    } else {
      if (value?.length === 1) {
        false;
      }
    }

    return (
      Array.isArray(value) && value.every((val) => typeof val === 'number')
    );
  }

  defaultMessage(): string {
    return `Invalid measurement values, must be an array of numbers and have atleast one value`;
  }
}

@ValidatorConstraint({ name: 'validateMeasurementUnitForType' })
export class ValidateMeasurementUnitForType
  implements ValidatorConstraintInterface
{
  validate(
    value: string,
    args: ValidationArguments,
  ): boolean | Promise<boolean> {
    const { type, unit } = args.object as any;

    const acceptableUnits = getAcceptableUnitsBasedOnMeasurementType(
      type as MeasurementType,
    );
    return acceptableUnits.length > 0
      ? acceptableUnits.some((val) => val === unit)
      : true;
  }

  defaultMessage(args: ValidationArguments): string {
    const { type } = args.object as any;

    return `Invalid measurement unit, allowed unit(s) for current type is/are ${getAcceptableUnitsBasedOnMeasurementType(type as MeasurementType)}`;
  }
}

// Reading Range Validators
@ValidatorConstraint({ name: 'validateMeasurementReadingRange' })
export class ValidateMeasurementReadingRange
  implements ValidatorConstraintInterface
{
  validate(
    value: string,
    args: ValidationArguments,
  ): boolean | Promise<boolean> {
    const { type, range } = args.object as any;

    if (!range?.length) return false;

    if (type === 'BLOODPRESSURE' && range?.length !== 4) return false;

    return range?.length === 2;
  }

  defaultMessage(args: ValidationArguments): string {
    const { type } = args.object as any;

    if (type === 'BLOODPRESSURE') {
      return 'Invalid values, values must be an array of 4 numbers only';
    }

    return 'Invalid values, values must be an array of 2 numbers only';
  }
}
