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

    try {
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
              select: {
                id: true,
                name: true,
                patient_medication_alerts: {
                  where: {
                    alert_time: {
                      gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
                      lt: new Date(),
                    },
                  },
                  select: {
                    taken: true,
                    alert_time: true,
                  },
                },
              },
            },
          },
        });
      // .patients({
      //   select: {
      //     medication: {
      //       where: {
      //         created_at: {
      //           gte: new Date(
      //             new Date().getTime() - days * 24 * 60 * 60 * 1000,
      //           ),
      //          },
      //        },
      //       select: {
      //         id: true,
      //         name: true,
      //         patient_medication_alerts: {
      //           select: {
      //             taken: true,
      //             alert_time: true,
      //           },
      //         },
      //       },
      //     },
      //   },
      // });

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
    } catch (error) {
      console.error('Error fetching patient compliance:', error);
      throw new AppError(
        'Could not fetch patient compliance data',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async getPatientCompliancePerPill(
    patientId: string,
    userId: string,
    role: UserRole,
  ): Promise<PatientCompliancePerPill> {

    try {
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
              created_at: true,
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
      console.log('patientMedications:========>>>>', JSON.stringify(patientMedications.medication))

      const formattedResults = patientMedications.medication.map((med) => {
        const complianceByDay: Record<string, {
          total: number;
          taken: number;
          not_taken: number;
          not_action_taken: number;
          pending: number;
        }> = {};

        const startDate = new Date(med.start_date);
        const endDate = new Date(med.end_date);
        const scheduledTimes: string[] = med.time || [];

        const alerts = med.patient_medication_alerts;

        // 1. Pre-group alerts by day (YYYY-MM-DD)
        const alertsByDay: Record<string, typeof alerts> = {};
        for (const alert of alerts) {
          const dayString = alert.alert_time.toISOString().slice(0, 10);
          if (!alertsByDay[dayString]) alertsByDay[dayString] = [];
          alertsByDay[dayString].push(alert);
        }

        // 2. Iterate over days
        for (
          let date = new Date(startDate);
          date <= endDate;
          date.setUTCDate(date.getUTCDate() + 1)
        ) {
          const dayString = date.toISOString().slice(0, 10);

          complianceByDay[dayString] = {
            total: scheduledTimes.length,
            taken: 0,
            not_taken: 0,
            not_action_taken: 0,
            pending: 0,
          };

          const dayAlerts = alertsByDay[dayString] || [];
          for (const alert of dayAlerts) {
            switch (alert.taken) {
              case 'TAKEN':
                complianceByDay[dayString].taken++;
                break;
              case 'NOT_TAKEN':
                complianceByDay[dayString].not_taken++;
                break;
              case 'MISSED':
                complianceByDay[dayString].not_action_taken++;
                break;
              case 'PENDING':
                complianceByDay[dayString].pending++;
                break;
            }
          }
        }

        return {
          id: med.id,
          name: med.name,
          created_at: med.created_at,
          compliance: complianceByDay,
        };
      });

      return {
        user: {
          id: patientId,
        },
        medications: formattedResults,
      };
    } catch (error) {
      console.error('Error fetching patient compliance:', error);
      throw error;
    }
    // public async getPatientCompliancePerPill(
    //   patientId: string,
    //   userId: string,
    //   role: UserRole,
    // ): Promise<PatientCompliancePerPill> {


    //   console.log('patientId:========>>>>', patientId)
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
    //         select: { id: true },
    //       },
    //       medication: {
    //         select: {
    //           id: true,
    //           name: true,
    //           start_date: true,
    //           end_date: true,
    //           frequency: true, // doses per day
    //           time: true,      // base time for the first dose
    //           created_at: true,
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
    //   console.log('patientMedications:========>>>>', JSON.stringify(patientMedications.medication))

    //   const formattedResults = patientMedications.medication.map((med) => {
    //     const complianceByDay: Record<string, {
    //       total: number;
    //       taken: number;
    //       not_taken: number;
    //       no_action_taken?: number;
    //       pending?: number;
    //     }> = {};

    //     const startDate = new Date(med.start_date);
    //     const endDate = new Date(med.end_date);
    //     const scheduledTimes: string[] = med.time || []; // <-- updated

    //     const alerts = med.patient_medication_alerts;

    //     // Iterate each day in the medication period
    //     for (
    //       let date = new Date(startDate);
    //       date <= endDate;
    //       date.setUTCDate(date.getUTCDate() + 1)
    //     ) {
    //       const dayString = date.toISOString().slice(0, 10); // YYYY-MM-DD
    //       complianceByDay[dayString] = {
    //         total: scheduledTimes.length,
    //         taken: 0,
    //         not_taken: 0,
    //       };

    //       // For each scheduled time
    //       for (const timeStr of scheduledTimes) {
    //         const [hour, minute] = timeStr.split(':').map(Number);
    //         const scheduledDose = new Date(Date.UTC(
    //           date.getUTCFullYear(),
    //           date.getUTCMonth(),
    //           date.getUTCDate(),
    //           hour,
    //           minute,
    //           0,
    //           0
    //         ));




    //         const takenAlert = alerts.find(a => a.taken === 'TAKEN');

    //         if (takenAlert) {
    //           complianceByDay[dayString].taken++;
    //         } else {
    //           complianceByDay[dayString].not_taken++;
    //         }
    //       }
    //     }

    //     return {
    //       id: med.id,
    //       name: med.name,
    //       created_at: med.created_at,
    //       compliance: complianceByDay,
    //     };
    //   });

    //   return {
    //     user: {
    //       id: patientId,
    //     },
    //     medications: formattedResults,
    //   };
    // }
  }
}
