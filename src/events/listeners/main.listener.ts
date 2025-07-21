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
  public async handleMedicationCreatedEvent(payload: MedicationCreatedEvent) {
    console.log('Medication Created Event:======>>>', payload);

    const startDate = new Date(payload.medication.start_date);
    const endDate = new Date(payload.medication.end_date);
    const times = payload.medication.time; // ['08:20', '14:00', '21:00']

    const alertsToCreate: {
      medication_id: string;
      alert_time: Date;
    }[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setUTCDate(d.getUTCDate() + 1)) {
      const currentDay = new Date(d); // copy the day

      for (const timeStr of times) {
        const [hour, minute] = timeStr.split(':').map(Number);


        const localDateStr = `${currentDay.getUTCFullYear()}-${(currentDay.getUTCMonth() + 1)
          .toString().padStart(2, '0')}-${currentDay.getUTCDate()
            .toString().padStart(2, '0')}T${timeStr}:00+05:00`;

        const alertTime = new Date(localDateStr);

        console.log('PKT:', localDateStr);
        console.log('UTC to store:', alertTime.toISOString());

        alertsToCreate.push({
          medication_id: payload.medication.id,
          alert_time: alertTime, // this is UTC
        });
      }
    }
    // for (let day = new Date(startDate); day <= endDate; day.setUTCDate(day.getUTCDate() + 1)) {
    //   for (const timeStr of times) {
    //     const [hour, minute] = timeStr.split(':').map(Number);
    //     console.log('Processing time:', timeStr, 'for day:', day.toISOString());
    //     const alertTime = new Date(Date.UTC(
    //       day.getUTCFullYear(),
    //       day.getUTCMonth(),
    //       day.getUTCDate(),
    //       hour,
    //       minute,
    //       0,
    //       0
    //     ));
    //     console.log('alertTime time:', alertTime.toISOString);
    //     alertsToCreate.push({
    //       medication_id: payload.medication.id,
    //       alert_time: alertTime,
    //     });
    //   }
    // }

    console.log('alertsToCreate:', alertsToCreate);

    if (alertsToCreate.length > 0) {
      await this.prisma.patientMedicationAlerts.createMany({
        data: alertsToCreate,
      });
    }
  }
  // public async handleMedicationCreatedEvent(payload: MedicationCreatedEvent) {
  //   console.log('Medication Created Event:======>>>', payload);

  //   const startDate = new Date(payload.medication.start_date);
  //   const endDate = new Date(payload.medication.end_date);
  //   const medicationTime = new Date(payload.medication.time);
  //   const frequency = payload.medication.frequency;

  //   const alertsToCreate: {
  //     medication_id: string;
  //     alert_time: Date;
  //   }[] = [];

  //   const timeDiff = endDate.getTime() - startDate.getTime();
  //   const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  //   console.log('Total Days: ', dayDiff);
  //   console.log('Frequency per Day: ', frequency);

  //   for (let i = 0; i <= dayDiff; i++) {
  //     const currentDay = new Date(
  //       startDate.getFullYear(),
  //       startDate.getMonth(),
  //       startDate.getDate() + i,
  //       0, 0, 0, 0
  //     );

  //     for (let j = 0; j < frequency; j++) {
  //       const alertDate = new Date(currentDay);

  //       // Base time for first dose, then evenly spread next doses
  //       alertDate.setUTCHours(medicationTime.getUTCHours(), medicationTime.getUTCMinutes(), 0, 0);

  //       // Spread doses equally over 24 hours (example logic)
  //       const intervalMinutes = (24 * 60) / frequency;
  //       alertDate.setUTCMinutes(alertDate.getUTCMinutes() + (j * intervalMinutes));

  //       alertsToCreate.push({
  //         medication_id: payload.medication.id,
  //         alert_time: alertDate,
  //       });
  //     }
  //   }

  //   console.log('alertsToCreate:======>>>', alertsToCreate);

  //   if (alertsToCreate.length > 0) {
  //     await this.prisma.patientMedicationAlerts.createMany({
  //       data: alertsToCreate,
  //     });
  //   }
  // }

}
