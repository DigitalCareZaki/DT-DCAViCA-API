import { Injectable, HttpStatus } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { AppError } from 'src/errors';

import type { UserRole } from '@types';
import type { PatientRag } from './types';

@Injectable()
export class RagService {
  constructor(private prisma: PrismaService) { }

  public async getAllPatientRag(
    userId: string,
    role: UserRole,
    start_date?: string,
    end_date?: string,
  ): Promise<PatientRag> {
    if (role === 'PATIENT') {
      throw new AppError('You can not access this route', HttpStatus.FORBIDDEN);
    }

    // last week query by default
    // [start_date, end_date] = await this.validateDates(start_date, end_date);

    const result = await this.prisma.measurement.groupBy({
      by: ['type', 'status'],
      where: {
        patient: {
          [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
            some: {
              user_id: userId,
            },
          },
        },
        // created_at: {
        //   gte: new Date(start_date),
        //   lte: new Date(end_date),
        // },
      },
      _count: {
        _all: true,
      },
    });

    return await this.formatResults(start_date, end_date, result);
  }

  public async getSinglePatientRag(
    patientId: string,
    userId: string,
    role: UserRole,
    start_date?: string,
    end_date?: string,
  ): Promise<PatientRag> {
    // Doctor
    if (role === 'DOCTOR' || role === 'NURSE') {
      const patient = await this.prisma.patient.findFirst({
        where: {
          AND: [
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
            {
              user_id: patientId,
            },
          ],
        },
        select: {
          user: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!patient) {
        throw new AppError(
          'Can not fetch information for this user',
          HttpStatus.FORBIDDEN,
        );
      }
    } else {
      // Patient
      if (patientId !== userId) {
        throw new AppError(
          'Can not fetch information for this patient',
          HttpStatus.FORBIDDEN,
        );
      }
    }

    [start_date, end_date] = await this.validateDates(start_date, end_date);

    const result = await this.prisma.measurement.groupBy({
      by: ['type', 'status'],
      where: {
        patient: {
          user: {
            id: patientId,
          },
        },
        created_at: {
          gte: new Date(start_date),
          lte: new Date(end_date),
        },
      },
      _count: {
        _all: true,
      },
    });

    return await this.formatResults(start_date, end_date, result);
  }

  private validateDates(start_date: string, end_date: string): [string, string] {
    // start_date not provided and end_date provided
    if (!start_date && end_date) throw new AppError('Please provide a start_date if an end_date is specified', HttpStatus.BAD_REQUEST);

    // if start_date, check it's validity
    if (start_date && isNaN(new Date(start_date).getTime())) throw new AppError('The start_date is not a valid date', HttpStatus.BAD_REQUEST);

    // if end_date, check it's validity
    if (end_date && isNaN(new Date(end_date).getTime())) throw new AppError('The end_date is not a valid date', HttpStatus.BAD_REQUEST);

    // if either not provided
    if (!start_date || !end_date) {
      const now = new Date();

      start_date = start_date ?? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      end_date = end_date ?? now.toISOString();
    }

    if (new Date(start_date) > new Date(end_date)) throw new AppError('The start_date cannot be greater than the end_date', HttpStatus.BAD_REQUEST);

    return [start_date, end_date];
  }

  private async formatResults(
    start_date: string | null,
    end_date: string | null,
    result: any[],
  ): Promise<PatientRag> {
    const formattedResult: PatientRag = {
      ecg: { high: 0, normal: 0, low: 0, pending: 0 },
      spo2: { high: 0, normal: 0, low: 0, pending: 0 },
      bloodpressure: { high: 0, normal: 0, low: 0, pending: 0 },
      bloodglucose: { high: 0, normal: 0, low: 0, pending: 0 },
      temperature: { high: 0, normal: 0, low: 0, pending: 0 },
      start_date: start_date ?? null,
      end_date: end_date ?? null,
    };

    result.forEach((item) => {
      formattedResult[item.type.toLowerCase()][
        item?.status?.toLowerCase() ?? 'pending'
      ] = item._count._all;
    });

    return formattedResult;
  }
}
