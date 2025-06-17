import { Injectable, HttpStatus } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { AppError } from 'src/errors';

import { ReadingRangeDTO } from './dto';

import type { PatientReadingRangeAlert } from './types';
import type { MeasurementType } from '@prisma/client';
import { TwilioService } from 'src/twilio/twilio.service';
import { UserRes } from '@types';

@Injectable()
export class ReadingRangeService {
  constructor(private prisma: PrismaService, private sms: TwilioService) { }

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

  public async createOrUpdateAlertForPatient(user: UserRes, data: ReadingRangeDTO): Promise<PatientReadingRangeAlert> {
    const doesPatientExistAndIsAssignedToUser = await this.prisma.patient.findFirst({
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
                    user_id: user.id,
                  },
                },
              },
              {
                nurses: {
                  some: {
                    user_id: user.id,
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
      throw new AppError('Either patient does not exist, or you are not associated with them', HttpStatus.FORBIDDEN);
    }

    const alertAlreadyExists = await this.prisma.patientMeasurementRange.findFirst({
      where: {
        AND: [
          {
            patient: {
              user_id: data.patient_id,
            }
          },
          {
            user_id: user.id,
          },
          {
            type: data.type as MeasurementType,
          }
        ]
      },
      select: {
        id: true,
      },
    });

    console.log('Alert check result:', alertAlreadyExists); // Add logging to debug

    if (!alertAlreadyExists) {
      const alt = await this.prisma.patientMeasurementRange.create({
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
              id: user.id,
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


      if (alt.send_sms) {
        const message = `Your patient ${alt.patient.user.first_name} has an alert for ${alt.type} of ${alt.range[0]}/${alt.range[1]}`;
        await this.sms.sendSMS(user.phone_number, message);

        // Save the SMS log to the database
        await this.prisma.sms.create({
          data: {
            receiver_id: user.id,
            sender_id: alt.patient.user.id,
            to: user.phone_number,
            body: message,
          },
        });



      } else {
        const contacts = await this.prisma.contacts.findMany({
          where: {
            user: {
              id: data.patient_id,
            }
          },
          select: {
            id: true,
            number: true
          },
        });

        if (contacts.length > 0) {
          contacts.forEach(async (contact) => {
            const message = `Your patient ${alt.patient.user.first_name} has an alert for ${alt.type} of ${alt.range[0]}/${alt.range[1]}`;
            await this.sms.sendSMS(contact.number, message);

            // Save the SMS log to the database
            await this.prisma.sms.create({
              data: {
                receiver_id: user.id,
                sender_id: alt.patient.user.id,
                to: contact.number,
                body: message,
              },
            });
          });
        }
      }

      return alt;
    } else {
      const alert = await this.prisma.patientMeasurementRange.update({
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
      if (data.send_sms) {
        const message = `Your patient ${alert.patient.user.first_name} has an alert for ${alert.type} of ${alert.range[0]}/${alert.range[1]}`;
        await this.sms.sendSMS(user.phone_number, message);

        // Save the SMS log to the database
        await this.prisma.sms.create({
          data: {
            receiver_id: user.id,
            sender_id: alert.patient.user.id,
            to: user.phone_number,
            body: message,
          },
        });
      } else {
        const contacts = await this.prisma.contacts.findMany({
          where: {
            user: {
              id: data.patient_id,
            }
          },
          select: {
            id: true,
            number: true
          },
        });

        if (contacts.length > 0) {
          contacts.forEach(async (contact) => {
            const message = `Your patient ${alert.patient.user.first_name} has an alert for ${alert.type} of ${alert.range[0]}/${alert.range[1]}`;
            await this.sms.sendSMS(contact.number, message);

            // Save the SMS log to the database
            await this.prisma.sms.create({
              data: {
                receiver_id: user.id,
                sender_id: alert.patient.user.id,
                to: contact.number,
                body: message,
              },
            });

          });
        }
      }

      return alert
    }

  }

}
