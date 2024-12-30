import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { PrismaService } from 'src/prisma/prisma.service';

import type { MeasurementStatus } from 'prisma/prisma-client';
import type { MeasurementCreatedEvent, MedicationCreatedEvent } from '../types';

@Injectable()
export class EventListener {
  constructor(private prisma: PrismaService) {}

  @OnEvent('measurement.created')
  public async handleMeasurementCreatedEvent(payload: MeasurementCreatedEvent) {
    if (payload.measurement.type === 'ECG') {
      // ECG not supported yet
      return;
    }

    const patientReadingRange =
      await this.prisma.patientMeasurementRange.findFirst({
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
        },
        orderBy: {
          created_at: 'desc',
        },
      });

    if (!patientReadingRange || patientReadingRange.range.length === 0) return;

    let category: MeasurementStatus | undefined = undefined;

    if (payload.measurement.type === 'BLOODPRESSURE') {
      const [systolic, diastolic] = payload.measurement.values;
      const [systolic_low, systolic_high, diastolic_low, diastolic_high] =
        patientReadingRange.range;

      category =
        systolic <= systolic_low || diastolic <= diastolic_low
          ? 'LOW'
          : systolic >= systolic_high || diastolic >= diastolic_high
            ? 'HIGH'
            : 'NORMAL';
    } else {
      const value = payload.measurement.values[0];
      const [low, high] = patientReadingRange.range;

      category = value <= low ? 'LOW' : value >= high ? 'HIGH' : 'NORMAL';
    }

    await this.prisma.measurement.update({
      where: {
        id: payload.measurement.id,
      },
      data: {
        status: category,
      },
    });
  }

  @OnEvent('medication.created')
  public async handleMedicationCreatedEvent(payload: MedicationCreatedEvent) {
    const startDate = new Date(payload.medication.start_date);
    const medicationTime = new Date(payload.medication.time);

    const timeDiff =
      new Date(payload.medication.end_date).getTime() - startDate.getTime();
    const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    const alertsToCreate: {
      medication_id: string;
      alert_time: Date;
    }[] = [];

    for (let i = 0; i <= dayDiff; i++) {
      const alertDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate(),
        medicationTime.getHours(),
        medicationTime.getMinutes(),
        0,
        0,
      );
      alertDate.setDate(alertDate.getDate() + i);

      alertsToCreate.push({
        medication_id: payload.medication.id,
        alert_time: alertDate,
      });
    }

    await this.prisma.patientMedicationAlerts.createMany({
      data: alertsToCreate,
    });
  }
}
