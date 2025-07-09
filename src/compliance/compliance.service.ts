import { Injectable, HttpStatus } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { AppError } from 'src/errors';

import type { UserRole } from '@types';
import type { PatientCompliance, PatientCompliancePerPill } from './types';

@Injectable()
export class ComplianceService {
  constructor(private prisma: PrismaService) { }

  public async getAllPatientsCompliance(
    userId: string,
    role: UserRole,
    type: string | undefined = 'weekly',
  ): Promise<PatientCompliance> {
    if (type !== 'weekly' && type !== 'monthly') {
      throw new AppError(
        'Please provide a valid type, it can only be weekly or monthly',
        HttpStatus.BAD_REQUEST,
      );
    }

    const days: number = type === 'weekly' ? 7 : 30;

    const queryEntity = (
      role === 'DOCTOR' ? this.prisma.doctor : this.prisma.nurse
    ) as any;

    const patientMedications = await queryEntity
      .findFirstOrThrow({
        where: {
          user: {
            id: userId,
          },
        },
        select: {
          id: true,
        },
      })
      .patients({
        select: {
          medication: {
            where: {
              created_at: {
                gte: new Date(
                  new Date().getTime() - days * 24 * 60 * 60 * 1000,
                ),
              },
            },
            select: {
              id: true,
              name: true,
              patient_medication_alerts: {
                select: {
                  taken: true,
                  alert_time: true,
                },
              },
            },
          },
        },
      });

    const Results = patientMedications.reduce((acc, patient) => {
      patient.medication.forEach((med) => {
        med.patient_medication_alerts.forEach((alert) => {
          const dateSting = new Date(alert.alert_time).toISOString();
          const date = dateSting.slice(0, 10);

          if (!acc[date]) {
            acc[date] = {
              total: 0,
              taken: 0,
              not_taken: 0,
            };
          }

          // adding total
          acc[date].total++;

          if (alert.taken === 'TAKEN') {
            acc[date].taken++;
          } else {
            acc[date].not_taken++;
          }
        });
      });

      return acc;
    }, {});

    return Results;
  }

  public async getPatientCompliancePerPill(
    patientId: string,
    userId: string,
    role: UserRole,
  ): Promise<PatientCompliancePerPill> {


    console.log('patientId:========>>>>', patientId)
    const patientMedications = await this.prisma.patient.findFirst({
      where: {
        AND: [
          {
            [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
              some: {
                user_id: userId,
              },
            },
          },
          {
            user_id: patientId,
          },
        ],
      },
      select: {
        user: {
          select: { id: true },
        },
        medication: {
          select: {
            id: true,
            name: true,
            start_date: true,
            end_date: true,
            frequency: true, // doses per day
            time: true,      // base time for the first dose
            patient_medication_alerts: {
              select: {
                taken: true,
                alert_time: true,
              },
            },
          },
        },
      },
    });
    console.log('patientMedications:========>>>>', patientMedications)

    const formattedResults = patientMedications.medication.map((med) => {
      const complianceByDay: Record<string, {
        total: number;
        taken: number;
        not_taken: number;
      }> = {};

      const startDate = new Date(med.start_date);
      const endDate = new Date(med.end_date);
      const scheduledTimes: string[] = med.time || []; // <-- updated

      const alerts = med.patient_medication_alerts;

      // Iterate each day in the medication period
      for (
        let date = new Date(startDate);
        date <= endDate;
        date.setUTCDate(date.getUTCDate() + 1)
      ) {
        const dayString = date.toISOString().slice(0, 10); // YYYY-MM-DD
        complianceByDay[dayString] = {
          total: scheduledTimes.length,
          taken: 0,
          not_taken: 0,
        };

        // For each scheduled time
        for (const timeStr of scheduledTimes) {
          const [hour, minute] = timeStr.split(':').map(Number);
          const scheduledDose = new Date(Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            hour,
            minute,
            0,
            0
          ));

          const matchingAlert = alerts.find(alert => {
            const diff = Math.abs(new Date(alert.alert_time).getTime() - scheduledDose.getTime());
            return diff <= 15 * 60 * 1000; // ±15 minutes
          });

          if (matchingAlert && matchingAlert.taken === 'TAKEN') {
            complianceByDay[dayString].taken++;
          } else {
            complianceByDay[dayString].not_taken++;
          }
        }
      }

      return {
        id: med.id,
        name: med.name,
        compliance: complianceByDay,
      };
    });
    return {
      user: {
        id: patientId,
      },
      medications: formattedResults,
    };
  }

  // public async getPatientCompliancePerPill(
  //   patientId: string,
  //   userId: string,
  //   role: UserRole,
  // ): Promise<PatientCompliancePerPill> {
  //   const patientMedications = await this.prisma.patient.findFirst({
  //     where: {
  //       AND: [
  //         {
  //           [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
  //             some: {
  //               user_id: userId,
  //             },
  //           },
  //         },
  //         {
  //           user_id: patientId,
  //         },
  //       ],
  //     },
  //     select: {
  //       user: {
  //         select: {
  //           id: true,
  //         },
  //       },
  //       medication: {
  //         select: {
  //           id: true,
  //           name: true,
  //           patient_medication_alerts: {
  //             select: {
  //               taken: true,
  //               alert_time: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   const formattedResults = patientMedications.medication.map((med) => ({
  //     id: med.id,
  //     name: med.name,
  //     compliance: med.patient_medication_alerts.reduce((acc, item) => {
  //       const date = new Date(item.alert_time).toISOString();

  //       if (!acc[date]) {
  //         acc[date] = {
  //           total: 0,
  //           taken: 0,
  //           not_taken: 0,
  //         };
  //       }

  //       acc[date].total++;

  //       if (item.taken === 'TAKEN') {
  //         acc[date].taken++;
  //       } else {
  //         acc[date].not_taken++;
  //       }

  //       return acc;
  //     }, {}),
  //   }));

  //   return {
  //     user: {
  //       id: patientId,
  //     },
  //     medications: formattedResults,
  //   };
  // }
}
