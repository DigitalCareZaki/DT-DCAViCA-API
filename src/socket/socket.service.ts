import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import type { AppointmentProps } from './types';
import type { MeetingChatProps } from './types';

@Injectable()
export class SocketService {
  private appointments = new Map<string, AppointmentProps[]>();
  private appointmentChat = new Map<string, MeetingChatProps[]>();

  constructor(private prisma: PrismaService) { }

  public onAppointmentJoin(payload: AppointmentProps): any {
    if (!payload.appointment_id) return;

    const appointmentId = payload.appointment_id.toString();

    const prev = this.appointments.get(appointmentId) ?? [];

    const existed = prev?.find(
      (user) => user.user_id === payload.user_id.toString(),
    );

    if (!existed) {
      const data: AppointmentProps = {
        ...(payload as any),
        hand: false,
        microphone: true,
        camera: true,
      };
      prev.push(data);
      this.appointments.set(appointmentId, prev);
    }

    return prev;
  }

  public onAppointmentParticipants(payload: AppointmentProps): AppointmentProps[] {
    if (!payload.appointment_id) return;

    const appointmentId = payload.appointment_id.toString();

    return this.appointments.get(appointmentId) ?? [];
  }

  public onParticipantLeft(user_id: string): { key: string; participants: AppointmentProps[]; } {
    try {
      if (!user_id) return;

      let appointment_id: string | null = null;

      this.appointments.forEach((users, key) => {
        const existedUser = users.find((user) => user.user_id === user_id);
        if (!existedUser) return;

        const data = this.appointments.get(key);
        const computed = data.filter((user) => user.user_id !== user_id);
        this.appointments.set(key, computed);
        appointment_id = key;
      });

      return {
        key: appointment_id,
        participants: this.appointments.get(appointment_id),
      };
    } catch (err) {
      console.error('Error in onParticipantLeft:', err);
      return { key: '', participants: [] };
    }

  }

  public OnmeetingControlls(
    appointment_id: string,
    user_id: string,
    payload: {
      hand: boolean;
      microphone: boolean;
      camera: boolean;
    },
  ): AppointmentProps[] {
    if (!user_id || appointment_id) [];

    const users = this.appointments.get(appointment_id);

    const computed = users?.map((user) => {
      if (user.user_id === user_id) {
        return {
          ...user,
          ...payload,
        };
      }

      return user;
    });

    this.appointments.set(appointment_id, computed);

    return computed;
  }

  public onMeetingChat(payload: MeetingChatProps): MeetingChatProps[] {
    const chats = this.appointmentChat.get(payload.appointment_id) ?? [];

    chats.push({
      ...payload,
    });

    this.appointmentChat.set(payload.appointment_id, chats);

    this.writeMessages(payload);

    return chats;
  }

  public getMeetingChat(meeting_id: string): MeetingChatProps[] {
    const chats = this.appointmentChat.get(meeting_id) ?? [];

    return chats;
  }

  private async writeMessages(payload: MeetingChatProps) {
    try {
      const room = await this.prisma.room.findUnique({
        where: {
          appointment_id: payload.appointment_id,
        },
      });

      if (!room) {
        const participants = await this.prisma.appointment.findUniqueOrThrow({
          where: {
            id: payload.appointment_id,
          },
          select: {
            participants: true,
          },
        });

        const room = await this.prisma.room.create({
          data: {
            appointment_id: payload.appointment_id,
            users: {
              connect: participants.participants.map((user) => ({
                id: user.user_id,
              })),
            },
          },
        });

        await this.prisma.chat.create({
          data: {
            message: payload.message,
            user_id: payload.user_id,
            media: payload.media,
            room_id: room.id,
          },
        });

        return;
      }

      await this.prisma.chat.create({
        data: {
          message: payload.message,
          user_id: payload.user_id,
          media: payload.media,
          room_id: room.id,
        },
      });
    } catch (err) {
      console.log(err);
      console.log('error writing chat');
    }
  }
}
