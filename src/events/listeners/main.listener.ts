import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import type { MeasurementStatus } from 'prisma/prisma-client';
import type { MeasurementCreatedEvent, MedicationCreatedEvent } from '../types';
import { TwilioService } from 'src/twilio/twilio.service';

@Injectable()
export class EventListener {
  constructor(private prisma: PrismaService, private sms: TwilioService) { }
  @OnEvent('measurement.created')
  public async handleMeasurementCreatedEvent(payload: MeasurementCreatedEvent) {
    if (payload.measurement.type === 'ECG') {
      // ECG not supported yet
      return;
    }

    const patientReadingRange = await this.prisma.patientMeasurementRange.findFirst({
      where: {
        patient: {
          user: {
            id: payload.patientId,
          },
        },
        type: payload.measurement.type,
      },
      select: {
        range: true,
        user: {
          select: {
            id: true,

          }
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    let category: MeasurementStatus = 'ALERT_NOT_SET';
    console.log('patientReadingRange:======>>>', patientReadingRange);
    if (patientReadingRange && patientReadingRange.range.length > 0) {
      if (payload.measurement.type === 'BLOODPRESSURE') {
        const [systolic, diastolic] = payload.measurement.values;
        const [systolic_low, systolic_high, diastolic_low, diastolic_high] = patientReadingRange.range;

        category =
          systolic <= systolic_low || diastolic <= diastolic_low
            ? 'LOW'
            : systolic >= systolic_high || diastolic >= diastolic_high
              ? 'HIGH'
              : 'NORMAL';
      } else {
        const value = payload.measurement.values[0];
        const [low, high] = patientReadingRange.range;
        console.log('value, low, high =====>>', value, low, high);
        category = value <= low ? 'LOW' : value >= high ? 'HIGH' : 'NORMAL';
        console.log('category =====>>', category);
      }
      if (payload.doctorId) {
        console.log('doctorId in Doctor:======>>>', payload.doctorId);
        await this.prisma.measurement.update({
          where: {
            id: payload.measurement.id,
          },
          data: {
            status: category,
          },
        });
      } else {

        const doctor = await this.prisma.doctor.findFirst({
          where: {
            user: {
              id: patientReadingRange.user.id,
            },
          },
        });
        console.log('doctor:======>>>', doctor);
        console.log('doctorId in Patient:======>>>', payload.doctorId);
        const measurement = await this.prisma.measurement.update({
          where: {
            id: payload.measurement.id,
          },
          data: {
            status: category,
            doctor_id: doctor.id, // assign the doctor id from the patient reading range
          },
          include: {
            patient: {
              include: {
                user: true,
              },
            },
            doctor: {
              include: {
                user: true,
              },
            },

          },

        });

        console.log('measurement after update:======>>>', measurement);
        if (measurement) {
          let message = '';
          if (measurement.values.length > 1) {
            message = `Your patient ${measurement.patient.user.first_name} has an alert for ${measurement.type} of ${measurement.values[0]}/${measurement.values[1]}`;

          } else {
            message = `Your patient ${measurement.patient.user.first_name} has an alert for ${measurement.type} of ${measurement.values[0]}`;

          }
          await this.sms.sendSMS(measurement.doctor.user.phone_number, message);

          // Save the SMS log to the database
          await this.prisma.sms.create({
            data: {
              receiver_id: measurement.doctor.user.id,
              sender_id: measurement.patient.user.id,
              to: measurement.doctor.user.phone_number,
              body: message,
            },
          });

          const contacts = await this.prisma.contacts.findMany({
            where: {
              user: {
                id: measurement.patient.user.id,
              }
            },
            select: {
              id: true,
              number: true,
              user: {
                select: {
                  id: true,
                },
              },
            },
          });
          if (contacts.length > 0) {
            contacts.forEach(async (contact) => {

              if (measurement.values.length > 1) {
                message = `Your patient ${measurement.patient.user.first_name} has an alert for ${measurement.type} of ${measurement.values[0]}/${measurement.values[1]}`;

              } else {
                message = `Your patient ${measurement.patient.user.first_name} has an alert for ${measurement.type} of ${measurement.values[0]}`;
              }

              await this.sms.sendSMS(contact.number, message);
              // Save the SMS log to the database
              console.log(contact, '=========>contact after sms');
              await this.prisma.sms.create({
                data: {
                  receiver_id: contact.user.id,
                  sender_id: measurement.patient.user.id,
                  to: contact.number,
                  body: message,
                },
              });

            });
          }
        }


      }
    }




  }


  @OnEvent('medication.created')
  public async handleMedicationCreatedEvent({ medication, patientId }: MedicationCreatedEvent) {
    const { start_date: startDate, end_date: endDate, time: times } = medication;

    const alertsToCreate: { medication_id: string; alert_time: Date; }[] = [];

    const PKT_OFFSET_MS = 5 * 60 * 60 * 1000; // +05:00

    // don't mutate the same Date object
    for (let d = new Date(startDate); d <= endDate; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      // Step 1: move the iterator date into PKT to get the correct local calendar day
      const dPk = new Date(d.getTime() + PKT_OFFSET_MS);

      times.forEach((time: string) => {
        const [hour, minute] = time.split(':').map(Number);

        // Step 2: build the PKT datetime (still represented as UTC for convenience)
        const pktDateTimeAsUTC = new Date(Date.UTC(
          dPk.getUTCFullYear(),
          dPk.getUTCMonth(),
          dPk.getUTCDate(),
          hour,
          minute,
          0,
          0
        ));

        // Step 3: convert that PKT time back to real UTC
        const alertTime = new Date(pktDateTimeAsUTC.getTime() - PKT_OFFSET_MS);

        alertsToCreate.push({
          medication_id: medication.id,
          alert_time: alertTime,
        });
      });
    }


    // for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    //   times.forEach(((time: string) => {
    //     const [hour, minute] = time.split(':').map(Number);
    //     const alertTime = new Date(d);  // 2025-07-25T19:00:00.000Z

    //     // 2025-07-26 20:30 PM +5

    //     // 2025-07-26T15:30:00.000Z

    //     alertTime.setHours(hour - 5, minute, 0, 0); // set hours, minutes, seconds, milliseconds

    //     // push the alert time for the medication
    //     alertsToCreate.push({
    //       medication_id: medication.id,
    //       alert_time: alertTime,
    //     });
    //   }));
    // };

    console.log('alertsToCreate:', alertsToCreate);

    if (alertsToCreate.length > 0) {
      await this.prisma.patientMedicationAlerts.createMany({
        data: alertsToCreate,
      });
    }
  }
}
