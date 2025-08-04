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
