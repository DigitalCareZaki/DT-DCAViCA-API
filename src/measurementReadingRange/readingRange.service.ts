import { Injectable, HttpStatus } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { AppError } from 'src/errors';

import { ReadingRangeDTO } from './dto';

import type { PatientReadingRangeAlert } from './types';
import type { MeasurementType } from '@prisma/client';

@Injectable()
export class ReadingRangeService {
  constructor(private prisma: PrismaService) {}

  public async getAlertForPatient(
    patientId: string,
    userId: string,
  ): Promise<PatientReadingRangeAlert[]> {
    return await this.prisma.patientMeasurementRange.findMany({
      where: {
        patient: {
          user_id: patientId,
        },
        user_id: userId,
      },
      select: {
        id: true,
        type: true,
        range: true,
        send_sms: true,
        send_email: true,
        user: {
          select: {
            id: true,
            first_name: true,
            middle_name: true,
            last_name: true,
            email: true,
          },
        },
        patient: {
          select: {
            user: {
              select: {
                id: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                email: true,
              },
            },
          },
        },
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  public async createOrUpdateAlertForPatient(
    userId: string,
    data: ReadingRangeDTO,
  ): Promise<PatientReadingRangeAlert> {
    const doesPatientExistAndIsAssignedToUser =
      await this.prisma.patient.findFirst({
        where: {
          AND: [
            {
              user_id: data.patient_id,
            },
            {
              OR: [
                {
                  doctors: {
                    some: {
                      user_id: userId,
                    },
                  },
                },
                {
                  nurses: {
                    some: {
                      user_id: userId,
                    },
                  },
                },
              ],
            },
          ],
        },
        select: {
          id: true,
        },
      });

    if (!doesPatientExistAndIsAssignedToUser) {
      throw new AppError(
        'Either patient does not exist, or you are not associated with them',
        HttpStatus.FORBIDDEN,
      );
    }

    const alertAlreadyExists =
      await this.prisma.patientMeasurementRange.findFirst({
        where: {
          patient: {
            user_id: data.patient_id,
          },
          user_id: userId,
          type: data.type as MeasurementType,
        },
        select: {
          id: true,
        },
      });

    if (!alertAlreadyExists) {
      return await this.prisma.patientMeasurementRange.create({
        data: {
          type: data.type as MeasurementType,
          range: data.range,
          send_sms: data.send_sms,
          send_email: data.send_email,
          patient: {
            connect: {
              user_id: data.patient_id,
            },
          },
          user: {
            connect: {
              id: userId,
            },
          },
        },
        select: {
          id: true,
          type: true,
          range: true,
          send_sms: true,
          send_email: true,
          user: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              email: true,
            },
          },
          patient: {
            select: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                  email: true,
                },
              },
            },
          },
          created_at: true,
          updated_at: true,
        },
      });
    } else {
      return await this.prisma.patientMeasurementRange.update({
        where: {
          id: alertAlreadyExists.id,
        },
        data: {
          type: data.type as MeasurementType,
          range: data.range,
          send_sms: data.send_sms,
          send_email: data.send_email,
        },
        select: {
          id: true,
          type: true,
          range: true,
          send_sms: true,
          send_email: true,
          user: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              email: true,
            },
          },
          patient: {
            select: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                  email: true,
                },
              },
            },
          },
          created_at: true,
          updated_at: true,
        },
      });
    }
  }
}
