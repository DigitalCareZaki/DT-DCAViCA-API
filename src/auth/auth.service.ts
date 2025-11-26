import { Injectable, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon from 'argon2';

import { PrismaService } from 'src/prisma/prisma.service';
import { OtpService } from './otp.service';

import type { UserRes } from '@types';
import {
  LoginDTO,
  ChangePasswordDTO,
  ForgotPasswordDTO,
  ResetPasswordDTO,
  SetPincodeDTO,
  VerifyPincodeDTO,
} from './dto';

import { AppError } from 'src/errors';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { SENDGRID_TEMPLATES } from 'src/constant';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly otpService: OtpService,
    private readonly sendgridService: SendgridService
  ) { }

  public async login(dto: LoginDTO) {
    const user: any = await this.prisma.user.findFirstOrThrow({
      where: {
        AND: {
          email: dto.email,
        },
      },
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        username: true,
        role: true,
        password: true,
        uri: true,
        active: true,
        organization_id: true,
        pincode: true,
        device_token: true,
        doctor: {
          select: {
            specialities: {
              select: {
                id: true,
                title: true,
              },
            },
            departments: {
              select: {
                id: true,
                title: true,
              },
            },
            // npi_number: true,
            // pmdc_number: true,
            // employee_id: true,
          },
        },
      }
    });
    console.log(user, '============>>>user')
    // Add speciality key using specialities[0].title if it exists
    if (user.doctor && user.doctor.specialities && user.doctor.specialities.length > 0) {
      user.speciality = user.doctor.specialities[0].title;
    }
    if (user.doctor && user.doctor.departments && user.doctor.departments.length > 0) {
      user.departments = user.doctor.departments[0].title;
    }

    if (!user.active) {
      throw new AppError('User is blocked', HttpStatus.UNAUTHORIZED);
    }

    if (dto.device_token) {
      user.device_token = dto.device_token;
      await this.prisma.user.update({
        where: { id: user.id },
        data: { device_token: dto.device_token },
      });
    }

    const isValidPassword = await argon.verify(user.password, dto.password);

    if (!isValidPassword)
      throw new AppError('Invalid password', HttpStatus.UNAUTHORIZED);

    const isPincode = !!user.pincode;

    delete user.doctor;
    delete user.password;
    delete user.pincode;

    // if (!user.fcmToken) {
    //   await this.prisma.user.update({
    //     where: { id: user.id }, 
    //     data: { fcmToken: dto.fcmToken }, 
    //   });
    // }

    return {
      ...user,
      isPincode,
      token: await this.signToken(
        user.username,
        user.id,
        `${user.first_name} ${user.last_name}`,
        user.first_name,
        user.middle_name,
        user.last_name,
        user.role,
        user.email,
        user.uri,
        user.organization_id,
        user.phone_number,
        !!isPincode,
      ),
    };
  }

  public register(): void { }

  private signToken(
    username: string,
    id: string,
    name: string,
    first_name: string,
    middle_name: string,
    last_name: string,
    role: string,
    email: string,
    uri: string,
    organization_id: string,
    phone_number: string,
    pincode: boolean,
  ) {
    const payload = {
      username,
      id,
      name,
      first_name,
      middle_name,
      last_name,
      role,
      email,
      uri,
      organization_id,
      phone_number,
      isPincode: pincode,
    };

    return this.jwt.signAsync(payload);
  }

  public async changePassword(
    dto: ChangePasswordDTO,
    user: UserRes,
  ): Promise<UserRes> {
    const updateUser = await this.prisma.user.update({
      where: {
        email: user.email,
      },
      data: {
        password: await argon.hash(dto.new_password),
      },
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        email: true,
        phone_number: true,
        username: true,
        role: true,
        organization_id: true,
        pincode: true,
      },
    });

    if (updateUser) {
      await this.prisma.password.create({
        data: {
          type: 'PASSWORD',
          updated_by: `${user.first_name} ${user.last_name}`,
          user_id: user.id
        },
      });
    }

    return {
      ...updateUser,
      isPincode: !!updateUser.pincode,
    };
  }

  public async resetPassword(payload: ResetPasswordDTO) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: payload.email,
      },
      select: {
        id: true,
      },
    });

    if (!user) throw new AppError('User not found', HttpStatus.NOT_FOUND);

    const hash = this.otpService.encryptOtp(payload.otp);

    const otpDB = await this.prisma.oTP.findFirst({
      where: {
        AND: [
          {
            user_id: user.id,
          },
          {
            used: false,
          },
          {
            expired: false,
          },
        ],
      },

      select: {
        id: true,
        otp: true,
        attempts: true,
        life: true,
      },
    });

    if (!otpDB) throw new AppError('Please generate new reset password request', HttpStatus.BAD_REQUEST);
    if (otpDB.attempts >= 3) throw new AppError('Too many attempts', HttpStatus.BAD_REQUEST);
    if (otpDB.life < new Date(Date.now())) throw new AppError('OTP expired', HttpStatus.BAD_REQUEST);

    if (otpDB.otp !== hash) {
      await this.prisma.oTP.update({
        where: {
          id: otpDB.id,
        },
        data: {
          attempts: {
            increment: 1,
          },
        },
        select: {
          id: true,
        },
      });
      throw new AppError('Invalid OTP', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.oTP.update({
      where: {
        id: otpDB.id,
      },
      data: {
        used: true,
      },
    });

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        password: await argon.hash(payload.password),
      },
    });

    return { success: true, message: 'Password reset successful' };
  }

  public async existsPincode(user: UserRes) {
    return await this.prisma.user.findFirstOrThrow({
      where: {
        id: user.id,
        pincode: {
          not: null,
        },
      },
      select: {
        id: true,
      },
    });
  }

  public async verifyPincode(user: UserRes, dto: VerifyPincodeDTO) {
    console.log(user);
    console.log('verify pincode');
    if (!user.isPincode) {
      throw new AppError(
        'Please set your pincode and relogin',
        HttpStatus.BAD_REQUEST,
      );
    }

    const userDB = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
      select: {
        pincode: true,
      },
    });

    const hash = await argon.hash(dto.pincode);
    console.log('Hashing pincode:', userDB.pincode, '=>', hash);

    const isValidPincode = await argon.verify(userDB.pincode, dto.pincode);

    if (!isValidPincode) {
      throw new AppError('Invalid pincode', HttpStatus.BAD_REQUEST);
    }

    return user;
  }

  public async setPincode(user: UserRes, dto: SetPincodeDTO) {
    const userDB = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: user.id,
      },
      select: {
        password: true,
      },
    });

    const isValidPassword = await argon.verify(userDB.password, dto.password);

    if (!isValidPassword) {
      throw new AppError('Invalid password', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        pincode: await argon.hash(dto.pincode),
      },
    });

    await this.prisma.password.create({
      data: {
        type: 'PIN',
        updated_by: `${user.first_name} ${user.last_name}`,
        user_id: user.id
      },
    });

    return {
      message: 'Pincode set successful',
      pincode: dto.pincode,
    };
  }

  public async forgotPassword(dto: ForgotPasswordDTO) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            email: dto.value,
          },
          {
            username: dto.value,
          },
          {
            phone_number: dto.value,
          },
        ],
      },

      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', HttpStatus.NOT_FOUND);
    }

    const { encryptedOtp, otp } = this.otpService.generateEncryptedOtp();

    await this.prisma.oTP.updateMany({
      where: {
        user_id: user.id,
      },
      data: {
        expired: true,
      },
    });

    await this.prisma.oTP.create({
      data: {
        user_id: user.id,
        otp: encryptedOtp,
        life: new Date(new Date().getTime() + 10 * 60 * 1000),  // 10 minutes
      },
    });

    const mailPayload = {
      to: user.email,
      templateId: SENDGRID_TEMPLATES.OTP,
      data: {
        otp,
      },
    };

    await this.sendgridService.sendSgMail(mailPayload);

    return {
      otp: otp,
      message: `Check your email address at ${user.email} for the OTP`,
    };
  }

  // public async getPinPasswordList(user: UserRes) {
  //   const pinPasswordList = await this.prisma.password.findMany({
  //     where: {
  //       user_id: user.id

  //     },

  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           first_name: true,
  //           last_name: true,
  //           middle_name: true,
  //           email: true,
  //           uri: true,
  //           phone_number: true,
  //         },
  //       },

  //     },

  //   });
  //   return pinPasswordList;
  // }


  public async getPinPasswordList(user: UserRes, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reports, totalItems] = await this.prisma.$transaction([
      this.prisma.password.findMany({
        skip,
        take: limit,
        orderBy: {
          created_at: 'desc',
        },
        where: { user_id: user.id },
        include: {
          user: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              middle_name: true,
              email: true,
              uri: true,
              phone_number: true,
            },
          },
        },
      }),

      this.prisma.password.count({
        where: { user_id: user.id },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: reports,
      pagination: {
        totalItems,
        perPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };
  }

}
