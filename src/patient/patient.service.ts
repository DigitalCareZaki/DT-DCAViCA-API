import { Injectable } from '@nestjs/common';

import * as argon from 'argon2';

import { PrismaService } from 'src/prisma/prisma.service';

import { PatientMedicationAlertDTO } from './dto';
import { AddPatientDTO } from 'src/organization/dto/addPatient.dto';

import type { MedicationTaken } from '@prisma/client';
import type { ProfileProps } from './types';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { SendMailPayload } from '@types';
import { SENDGRID_TEMPLATE } from 'src/constant';

@Injectable()
export class PatientService {
  constructor(
    private prisma: PrismaService,
    private mail: SendgridService,
  ) { }

  public async addPatient(
    data: AddPatientDTO,
    organization_id: string,
    location_id: string,
  ): Promise<boolean> {
    const res = await this.prisma.user.create({
      data: {
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        phone_number: data.phone_number,
        email: data.email,
        password: await this.encryptPassword(data.password),
        username: data.username,
        dob: data.dob,
        organization_id,
        gender: data.gender,
        title: data.title,
        role: 'PATIENT',
        location_id,
        associated_branches: {
          connect: {
            id: data.branch_id,
          },
        },
      },
    });

    const patient = await this.prisma.patient.create({
      data: {
        height: data.height,
        weight: data.weight,
        user_id: res.id,
      },
      select: {
        id: true,
        user: true,
      },
    });

    if (data.doctor_id) {
      await this.prisma.patient.update({
        where: {
          id: patient.id,
        },
        data: {
          doctors: {
            connect: {
              user_id: data.doctor_id,
            },
          },
        },
      });
    }

    if (data.nurse_id) {
      await this.prisma.patient.update({
        where: {
          id: patient.id,
        },
        data: {
          nurses: {
            connect: {
              user_id: data.nurse_id,
            },
          },
        },
      });
    }

    const mailPayload = {
      to: [patient.user.email],
      data: {
        subject: 'Patient Account Created',
        patientName: patient.user.username,
        patientEmail: patient.user.email,
        patientPassword: data.password,
      },
      templateId: SENDGRID_TEMPLATE.PATIENT_REGISTRATION,
    } satisfies SendMailPayload;

    await this.mail.sendSgMail(mailPayload);

    return true;
  }

  public async profile(id: string): Promise<ProfileProps> {
    return this.prisma.user.findUnique({
      where: {
        id,
      },
      select: {
        first_name: true,
        middle_name: true,
        last_name: true,
        dob: true,
        uri: true,
        gender: true,
        title: true,
        email: true,
        phone_number: true,
        username: true,
        created_at: true,
        updated_at: true,
        patient: {
          select: {
            emr: true,
            weight: true,
            height: true,
          },
        },
      },
    });
  }

  public async updateProfle(userId: string, data: any) {
    return await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        uri: data.uri,
        phone_number: data.phone_number,
        gender: data.gender,
        title: data.title,
        patient: {
          update: {
            weight: Number(data?.weight) ?? null,
            height: Number(data?.height) ?? null,
          },
        },
      },
    });
  }

  public async getAllPatientMedicationAlertsForToday(userId: string) {
    const date = new Date();
    const today = new Date(
      Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
    );

    const tomorrow = new Date(today);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    return await this.prisma.medication.findMany({
      where: {
        patient: {
          user_id: userId,
        },
        end_date: {
          gte: today,
        },
        patient_medication_alerts: {
          some: {
            alert_time: {
              gte: today,
              lte: tomorrow,
            },
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
        created_at: true,
        updated_at: true,
        patient_medication_alerts: {
          where: {
            alert_time: {
              gte: today,
              lte: tomorrow,
            },
          },
          select: {
            id: true,
            alert_time: true,
            taken: true,
          },
        },
      },
    });
  }

  public async updatePatientMedicationAlertTakenStatus(
    patientMedicationId: string,
    patientId: string,
    data: PatientMedicationAlertDTO,
  ) {
    return await this.prisma.patientMedicationAlerts.update({
      data: {
        taken: data.taken as MedicationTaken,
      },
      where: {
        medication: {
          patient: {
            user_id: patientId,
          },
        },
        id: patientMedicationId,
      },
      select: {
        id: true,
        medication: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  private async encryptPassword(value): Promise<string> {
    return await argon.hash(value);
  }
}
