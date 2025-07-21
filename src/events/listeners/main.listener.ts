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
    const startDate = medication.start_date;
    const endDate = medication.end_date;
    const times = medication.time; // ['08:20', '14:00', '21:00']

    const alertsToCreate: { medication_id: string; alert_time: Date; }[] = [];

    for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
      console.log('d >>>>>>> ', d);
      console.log('endDate >>>>>>> ', endDate);

      times.forEach(((time: string) => {
        const [hour, minute] = time.split(':').map(Number);
        const alertTime = new Date(d);

        // Set the hours and minutes from the time string
        alertTime.setHours(hour);
        alertTime.setMinutes(minute);
        alertTime.setSeconds(0);
        alertTime.setMilliseconds(0);

        console.log('alertTime >>>>>>> ', alertTime);

        // Ensure the alert time is within the medication period
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
