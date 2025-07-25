import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from 'src/prisma/prisma.service';
import type { MeasurementStatus } from 'prisma/prisma-client';
import type { MeasurementCreatedEvent, MedicationCreatedEvent } from '../types';

@Injectable()
export class EventListener {
  constructor(private prisma: PrismaService) { }
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
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    let category: MeasurementStatus = 'ALERT_NOT_SET';

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

        category = value <= low ? 'LOW' : value >= high ? 'HIGH' : 'NORMAL';
      }
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
  public async handleMedicationCreatedEvent({ medication, patientId }: MedicationCreatedEvent) {
    const { start_date: startDate, end_date: endDate, time: times } = medication;

    const alertsToCreate: { medication_id: string; alert_time: Date; }[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      times.forEach(((time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        const alertTime = new Date(d);
        alertTime.setDate(alertTime.getDate() + 1);
        alertTime.setHours(hour - 5, minute, 0, 0); // set hours, minutes, seconds, milliseconds

        // push the alert time for the medication
        alertsToCreate.push({
          medication_id: medication.id,
          alert_time: alertTime,
        });
      }));
    };

    console.log('alertsToCreate:', alertsToCreate);

    if (alertsToCreate.length > 0) {
      await this.prisma.patientMedicationAlerts.createMany({
        data: alertsToCreate,
      });
    }
  }
}
