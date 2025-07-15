import { Injectable, HttpStatus, HttpException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from 'src/prisma/prisma.service';

import { AppError } from 'src/errors';

import { MedicationDTO } from './dto';

import type { MedicationUnit } from '@prisma/client';
import type { UserRole } from '@types';
import type { ModifiedMedication } from './types';
import type { MedicationCreatedEvent } from 'src/events/types';
import { Response } from 'express';

@Injectable()
export class MedicationService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) { }

  public async getPatientMedication(
    patientId: string,
    userId: string,
    role: UserRole,
    search: string,
    page: number = 1,
    limit: number = 10
  ): Promise<ModifiedMedication[]> {
    if (role === 'DOCTOR' || role === 'NURSE') {
      return await this.prisma.medication.findMany({
        where: {
          AND: [
            {
              patient: {
                [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
                  some: {
                    user_id: userId,
                  },
                },
              },
            },
            {
              patient: {
                user_id: patientId,
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          time: true,
          dosage: true,
          frequency: true,
          unit: true,
          doctor: {
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
          appointment: {
            select: {
              id: true,
              title: true,
              start_date: true,
              end_date: true,
            },
          },
          created_at: true,
        },
      });
    } else {
      // Patient
      if (patientId !== userId) {
        throw new AppError('Can not fetch information for this patient', HttpStatus.FORBIDDEN);
      }

      return await this.prisma.medication.findMany({
        where: {
          AND: [
            {
              patient: {
                user_id: patientId,
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          time: true,
          dosage: true,
          frequency: true,
          unit: true,
          doctor: {
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
          appointment: {
            select: {
              id: true,
              title: true,
              start_date: true,
              end_date: true,
            },
          },
          created_at: true,
        },
      });
    }
  }

  public async getPatientMedicationForApp(
    patientId: string,
    userId: string,
    role: UserRole,
    search: string,
    page: number = 1,
    limit: number = 10
  ) {
    if (role === 'DOCTOR' || role === 'NURSE') {
      return await this.prisma.medication.findMany({
        where: {
          AND: [
            {
              patient: {
                [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
                  some: {
                    user_id: userId,
                  },
                },
              },
            },
            {
              patient: {
                user_id: patientId,
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          time: true,
          dosage: true,
          frequency: true,
          unit: true,
          created_at: true,
        },
      });
    } else {
      // Patient
      if (patientId !== userId) {
        throw new AppError('Can not fetch information for this patient', HttpStatus.FORBIDDEN);
      }

      return await this.prisma.medication.findMany({
        where: {
          AND: [
            {
              patient: {
                user_id: patientId,
              },
            },
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          time: true,
          dosage: true,
          frequency: true,
          unit: true,
          created_at: true,
        },
      });
    }
  }

  public async createPatientMedication(
    patientId: string,
    userId: string,
    role: UserRole,
    data: MedicationDTO,
  ): Promise<ModifiedMedication> {
    if (role === 'NURSE' || role === 'PATIENT') {
      throw new AppError(
        'You can not create medications for patients',
        HttpStatus.FORBIDDEN,
      );
    }

    let medication: ModifiedMedication | undefined = undefined;

    if (data.appointment_id) {
      const appointmentExists = this.prisma.appointment.findFirst({
        where: {
          AND: [
            {
              id: data.appointment_id,
            },
            {
              OR: [
                {
                  participants: {
                    some: {
                      id: userId,
                    },
                  },
                },
                {
                  organizer_id: userId,
                },
              ],
            },
          ],
        },
        select: {
          id: true,
        },
      });

      if (!appointmentExists) {
        throw new AppError(
          'Appointment does not exist, or you do not have access to it',
          HttpStatus.NOT_FOUND,
        );
      }

      medication = await this.prisma.medication.create({
        data: {
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
          time: data.time,
          dosage: data.dosage,
          frequency: data.frequency,
          unit: data.unit as MedicationUnit,
          patient: {
            connect: {
              user_id: patientId,
            },
          },
          doctor: {
            connect: {
              user_id: userId,
            },
          },
          appointment: {
            connect: {
              id: data.appointment_id,
            },
          },
        },
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          time: true,
          dosage: true,
          frequency: true,
          unit: true,
          doctor: {
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
          appointment: {
            select: {
              id: true,
              title: true,
              start_date: true,
              end_date: true,
            },
          },
          created_at: true,
        },
      });
    } else {
      medication = await this.prisma.medication.create({
        data: {
          name: data.name,
          start_date: data.start_date,
          end_date: data.end_date,
          time: data.time,
          dosage: data.dosage,
          frequency: data.frequency,
          unit: data.unit as MedicationUnit,
          patient: {
            connect: {
              user_id: patientId,
            },
          },
          doctor: {
            connect: {
              user_id: userId,
            },
          },
        },
        select: {
          id: true,
          name: true,
          start_date: true,
          end_date: true,
          time: true,
          dosage: true,
          frequency: true,
          unit: true,
          doctor: {
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
        },
      });
    }

    process.nextTick(() => {
      const payload: MedicationCreatedEvent = {
        patientId,
        medication,
      };
      this.eventEmitter.emitAsync('medication.created', payload);
    });

    return medication;
  }

  public async updateMedication(
    patientMedicationId: string,
    data: any,
  ) {
    console.log('Updating medication with data:', data);
    try {
      const medicine = await this.prisma.patientMedicationAlerts.findFirst({
        where: { id: patientMedicationId }
      });

      if (!medicine) {
        throw new AppError('Medication alert not found', HttpStatus.NOT_FOUND);
      }

      const medication = await this.prisma.patientMedicationAlerts.update({
        where: {
          id: medicine.id,
        },
        data: {
          taken: data.taken
        },
      });
      console.log('Medication updated successfully:', medication);
      return medication;
    } catch (error) {
      console.error('Error updating medication:', error);
    }

  }

  public async checkPatientCurrentMedication(userId: string, res: Response) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        user_id: userId,
      },
      select: {
        id: true,
      },
    });

    const medication = await this.prisma.medication.findFirst({
      where: {
        start_date: {
          lte: new Date(),
        },
        end_date: {
          gte: new Date(),
        },
        patient: {
          id: patient.id,
        },
      },
    });

    // console.log('medications >>> ', medication);
    if (!medication) {
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        success: true,
        data: {},
      });
    }

    const now = new Date();                             // current moment
    const oneHourAgo = new Date(now.getTime() - 60 * 60_000);  // now − 1 h
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60_000);  // now − 5 min

    const patientMedicationAlert = await this.prisma.patientMedicationAlerts.findFirst({
      where: {
        medication_id: medication.id,
        taken: 'PENDING',
        alert_time: {
          gte: oneHourAgo,     // alert_time is **not older than** 1 hour
          lte: fiveMinutesAgo, // alert_time is **at least** 5 min old
        },
      },
      orderBy: { alert_time: 'asc' },  // earliest that fits the window
    });

    console.log('patientMedicationAlert >>> ', patientMedicationAlert);

    if (!patientMedicationAlert) {
      return res.status(HttpStatus.OK).json({
        statusCode: HttpStatus.OK,
        success: true,
        data: {},
      });
    }

    return res.status(HttpStatus.OK).json({
      statusCode: HttpStatus.OK,
      success: true,
      data: patientMedicationAlert,
    });
  }
}
