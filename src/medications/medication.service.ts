import { Injectable, HttpStatus } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from 'src/prisma/prisma.service';

import { AppError } from 'src/errors';

import { MedicationDTO } from './dto';

import type { MedicationUnit } from '@prisma/client';
import type { UserRole } from '@types';
import type { ModifiedMedication } from './types';
import type { MedicationCreatedEvent } from 'src/events/types';

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
    medicationId: string,
    data: any,
  ) {
    console.log('Updating medication with data:', data);
    try {
      const medicine = await this.prisma.patientMedicationAlerts.findFirst({
        where: { medication_id: medicationId }
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
}
