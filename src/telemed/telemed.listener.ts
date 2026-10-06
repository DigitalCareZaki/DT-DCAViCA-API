import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { FirebaseService } from 'src/firebaseNotification/firebase.service';
import { SocketGateway } from 'src/socket/socket.gateway';

import type { AppointmentCreatedEvent } from './types';

@Injectable()
export class TelemedListener {
  constructor(
    private readonly firebase: FirebaseService,
    private readonly socketGateway: SocketGateway,
  ) {}

  @OnEvent('appointment.created')
  public async handleAppointmentCreatedEvent({
    appointmentId,
    title,
    organizer,
    participantIds,
  }: AppointmentCreatedEvent): Promise<void> {
    const organizerName = [
      organizer.first_name,
      organizer.middle_name,
      organizer.last_name,
    ]
      .filter(Boolean)
      .join(' ');

    // One participant failing (e.g. push delivery) must not block the others;
    // sendNotification already logs its own errors.
    await Promise.allSettled(
      participantIds.map(async (participantId) => {
        this.socketGateway.emitAppointmentUpdate(participantId, {
          appointment_id: appointmentId,
          action: 'CREATED',
        });

        await this.firebase.sendNotification(
          organizer.id,
          participantId,
          'New Appointment',
          `${organizerName} requested an appointment '${title}'`,
        );
      }),
    );
  }
}
