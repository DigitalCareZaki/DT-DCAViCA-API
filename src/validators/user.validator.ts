import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from 'src/prisma/prisma.service';

const allowedTitles = ['MR', 'MS', 'MRS', 'MISS', 'MASTER', 'MADAM'];
const allowedGenders = ['MALE', 'FEMALE', 'TRANS', 'UNKNOWN'];

@ValidatorConstraint({ name: 'allowedUserTitle' })
export class ValidateUserType implements ValidatorConstraintInterface {
  validate(value: string): boolean | Promise<boolean> {
    return allowedTitles.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid user type, allowed types are ${allowedTitles.toString()}`;
  }
}

@ValidatorConstraint({ name: 'allowedUserGenders' })
export class ValidateUserGenders implements ValidatorConstraintInterface {
  validate(value: any): boolean | Promise<boolean> {
    return allowedGenders.some((val) => val === value);
  }

  defaultMessage(): string {
    return `Invalid user gender, allowed genders are ${allowedGenders.toString()}`;
  }
}

@ValidatorConstraint({ name: 'uniqueEmail' })
export class ValidateUniqueEmail implements ValidatorConstraintInterface {
  private prisma: PrismaService | undefined = undefined;
  constructor() {
    const config = new ConfigService();
    this.prisma = new PrismaService(config);
  }

  validate(value: any): boolean | Promise<boolean> {
    if (!value) return false;
    return this.validateEmail(value);
  }

  private async validateEmail(value: string): Promise<boolean> {
    const res = await this.prisma.user.findUnique({
      where: {
        email: value,
      },
      select: {
        id: true,
      },
    });

    return !res?.id?.length;
  }

  defaultMessage(): string {
    return `Duplicate email address`;
  }
}

@ValidatorConstraint({ name: 'uniquePhoneNumber' })
export class ValidateUniquePhone implements ValidatorConstraintInterface {
  private prisma: PrismaService | undefined = undefined;
  constructor() {
    const config = new ConfigService();
    this.prisma = new PrismaService(config);
  }

  validate(value: any): boolean | Promise<boolean> {
    if (!value) return false;
    return this.validatePhone(value);
  }

  private async validatePhone(value: string): Promise<boolean> {
    const res = await this.prisma.user.findUnique({
      where: {
        phone_number: value,
      },
      select: {
        id: true,
      },
    });

    return !res?.id?.length;
  }

  defaultMessage(): string {
    return 'Phone number already exists';
  }
}

@ValidatorConstraint({ name: 'uniqueUsername' })
export class ValidateUniqueUsername implements ValidatorConstraintInterface {
  private prisma: PrismaService | undefined = undefined;
  constructor() {
    const config = new ConfigService();
    this.prisma = new PrismaService(config);
  }

  validate(value: any): boolean | Promise<boolean> {
    if (!value) return false;
    return this.validateUsername(value);
  }

  private async validateUsername(value: string): Promise<boolean> {
    const res = await this.prisma.user.findUnique({
      where: {
        username: value,
      },
      select: {
        id: true,
      },
    });

    return !res?.id?.length;
  }

  defaultMessage(): string {
    return 'Username already exists';
  }
}
