import { ConfigService } from '@nestjs/config';
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { PrismaService } from 'src/prisma/prisma.service';

@ValidatorConstraint({ name: 'branchUniqueEmail' })
export class ValidateBranchUniqueEmail implements ValidatorConstraintInterface {
  private prisma: PrismaService | undefined = undefined;

  constructor() {
    const config = new ConfigService();
    this.prisma = new PrismaService(config);
  }

  validate(value: any): boolean | Promise<boolean> {
    if (!value) return true;

    return this.validateEmail(value);
  }

  private async validateEmail(value: string): Promise<boolean> {
    const res = await this.prisma.branch.findUnique({
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
    return 'Email address already exists';
  }
}
@ValidatorConstraint({ name: 'branchUniquePhoneNumber' })
export class ValidateBranchUniquePhoneNumber
  implements ValidatorConstraintInterface
{
  private prisma: PrismaService | undefined = undefined;

  constructor() {
    const config = new ConfigService();
    this.prisma = new PrismaService(config);
  }

  validate(value: any): boolean | Promise<boolean> {
    if (!value) return true;

    return this.validatePhoneNumber(value);
  }

  private async validatePhoneNumber(value: string): Promise<boolean> {
    const res = await this.prisma.branch.findUnique({
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
