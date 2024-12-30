import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { HelpersService } from 'src/helpers/helpers.service';
import { TelemedCreateDTO } from './dto';
import { TelemedActionDTO } from './dto/action.dto';

import type { UserRes } from '@types';
import type {
  Appointment,
  GetAppointmentsType,
  SearchResProps,
  RequestedAppointmentProps,
  TelemedActionProps,
  TelemedViewProps,
  MeetingMetadataProps,
  JoinedMeetingProps,
  LeftMeetingProps,
  GetMeetingParticipantsProps,
  GetMeetingChatsProps,
} from './types';

@Injectable()
export class TelemedService {
  constructor(
    private prisma: PrismaService,
    private helperService: HelpersService,
  ) {}

  public async createAppointment(
    user: UserRes,
    dto: TelemedCreateDTO,
  ): Promise<Appointment> {
    const appointment = await this.prisma.appointment.create({
      data: {
        title: dto.title,
        description: dto.description,
        start_date: dto.start_date,
        end_date: dto.end_date,
        type: dto.type,
        about: dto.about,
        organizer_id: user.id,
      },
    });

    const records = dto.users.map((user) => {
      return this.prisma.appointmentParticipants.create({
        data: {
          status: 'PENDING',
          user_id: user,
          appointment_id: appointment.id,
        },
      });
    });

    await this.prisma.$transaction(records);

    await this.prisma.room.create({
      data: {
        appointment_id: appointment.id,
        users: {
          connect: dto.users.map((user) => ({ id: user })),
        },
      },
    });

    return appointment;
  }

  public async getAppointments(id: string): Promise<GetAppointmentsType[]> {
    return this.prisma.appointment.findMany({
      where: {
        organizer_id: id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        about: true,
        start_date: true,
        end_date: true,
        participants: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                middle_name: true,
                role: true,
                uri: true,
              },
            },
            status: true,
          },
        },

        created_at: true,
      },
    });
  }

  public async assignParticipientPatient(
    userId: string,
    appointmentId: string,
  ): Promise<boolean> {
    await this.prisma.user.findFirstOrThrow({
      where: {
        AND: [
          {
            id: userId,
          },
          {
            role: 'PATIENT',
          },
        ],
      },
    });

    await this.prisma.appointment.update({
      where: {
        id: appointmentId,
      },
      data: {
        participants: {
          connect: {
            id: userId,
          },
        },
      },
    });

    return true;
  }

  public async searchTelemed(
    search: string,
    currentUser: string,
  ): Promise<SearchResProps[]> {
    return await this.prisma.user.findMany({
      where: {
        AND: [
          {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            NOT: {
              id: currentUser,
            },
          },
          {
            OR: [
              {
                role: 'DOCTOR',
              },
              {
                role: 'NURSE',
              },
              {
                role: 'PATIENT',
              },
            ],
          },
        ],
      },

      select: {
        email: true,
        first_name: true,
        last_name: true,
        middle_name: true,
        id: true,
      },
    });
  }

  public async requested(user: UserRes): Promise<RequestedAppointmentProps[]> {
    return this.prisma.appointmentParticipants.findMany({
      where: {
        user_id: user.id,
      },

      select: {
        status: true,
        id: true,
        appointment: {
          select: {
            id: true,
            about: true,
            type: true,
            title: true,
            start_date: true,
            end_date: true,
            description: true,
            organizer: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                middle_name: true,
                uri: true,
                role: true,
              },
            },

            participants: {
              select: {
                id: true,
              },
            },

            created_at: true,
          },
        },
      },
    });
  }

  public async action(
    user: UserRes,
    data: TelemedActionDTO,
  ): Promise<TelemedActionProps> {
    const appointment =
      await this.prisma.appointmentParticipants.findFirstOrThrow({
        where: {
          AND: [
            {
              id: data.id,
            },
            {
              user_id: user.id,
            },
          ],
        },

        select: {
          id: true,
        },
      });

    await this.prisma.appointmentParticipants.update({
      where: {
        id: appointment.id,
      },

      data: {
        status: data.status,
      },
    });

    return {
      updated: true,
    };
  }

  public async details(id: string): Promise<TelemedViewProps> {
    return this.prisma.appointment.findUnique({
      where: {
        id,
      },

      select: {
        participants: {
          select: {
            status: true,
            user: {
              select: {
                first_name: true,
                last_name: true,
                middle_name: true,
                email: true,
                role: true,
              },
            },
          },
        },

        id: true,
        start_date: true,
        end_date: true,
        created_at: true,
        title: true,
        description: true,
        about: true,
        type: true,
        notes: true,
        status: true,
        organizer_id: true,
        organizer: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
          },
        },
      },
    });
  }

  public async validateMeeting(id: string, user: UserRes): Promise<boolean> {
    await this.prisma.appointment.findFirstOrThrow({
      where: {
        AND: [
          {
            id,
          },
          {
            OR: [
              {
                participants: {
                  some: {
                    user_id: user.id,
                  },
                },
              },
              {
                organizer_id: user.id,
              },
            ],
          },
        ],
      },

      select: {
        id: true,
      },
    });

    return true;
  }

  public async getMeetingMetaData(id: string): Promise<MeetingMetadataProps> {
    return await this.prisma.appointment.findUnique({
      where: {
        id,
      },

      select: {
        title: true,
        description: true,
        participants: {
          select: {
            id: true,
          },
        },
      },
    });
  }

  public async joinedMeeting(
    id: string,
    user: UserRes,
  ): Promise<JoinedMeetingProps> {
    const isExisted = await this.prisma.joinedParticipants.findFirst({
      where: {
        AND: [
          {
            appointment_id: id,
          },
          {
            user_id: user.id,
          },
        ],
      },

      select: {
        id: true,
      },
    });

    if (isExisted?.id) {
      await this.prisma.joinedParticipants.update({
        where: {
          id: isExisted.id,
        },

        data: {
          left: false,
        },
      });

      return {
        created: false,
      };
    }

    await this.prisma.joinedParticipants.create({
      data: {
        user_id: user.id,
        appointment_id: id,
      },
    });

    return {
      created: true,
    };
  }

  public async getMeetingParticipants(
    id: string,
  ): Promise<GetMeetingParticipantsProps[]> {
    return await this.prisma.joinedParticipants.findMany({
      where: {
        appointment_id: id,
      },

      select: {
        user: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            id: true,
            role: true,
          },
        },

        left: true,
      },
    });
  }

  public async leftMeeting(
    id: string,
    user: UserRes,
  ): Promise<LeftMeetingProps> {
    const data = await this.prisma.joinedParticipants.findFirst({
      where: {
        AND: [
          {
            appointment_id: id,
          },
          {
            user_id: user.id,
          },
        ],
      },

      select: {
        id: true,
      },
    });

    if (data.id) {
      await this.prisma.joinedParticipants.update({
        where: {
          id: data.id,
        },

        data: {
          left: true,
          left_at: new Date(),
        },
      });

      return {
        updated: true,
      };
    }

    return {
      updated: false,
    };
  }

  public async updateMeetingStatus(
    id: string,
    userId: string,
    status: string,
  ): Promise<boolean> {
    await this.prisma.appointment.findFirstOrThrow({
      where: {
        AND: [
          {
            id,
          },
          {
            organizer_id: userId,
          },
        ],
      },
    });

    await this.prisma.appointment.update({
      where: {
        id,
      },

      data: {
        status: status as any,
      },
    });

    return true;
  }

  public async getMeetingDiscussion(
    appointmentId: string,
    user: UserRes,
  ): Promise<GetMeetingChatsProps> {
    await this.prisma.appointment.findFirstOrThrow({
      where: {
        AND: [
          {
            id: appointmentId,
          },
          {
            OR: [
              {
                participants: {
                  some: {
                    user_id: user.id,
                  },
                },
              },
              {
                organizer_id: user.id,
              },
            ],
          },
        ],
      },

      select: {
        id: true,
      },
    });

    const data = await this.prisma.room.findUnique({
      where: {
        appointment_id: appointmentId,
      },

      select: {
        chats: {
          select: {
            id: true,
            media: true,
            created_at: true,
            read: true,
            message: true,
            auhor: {
              select: {
                first_name: true,
                last_name: true,
                middle_name: true,
                uri: true,
                role: true,
                id: true,
              },
            },
          },
        },
      },
    });

    return {
      chats: data?.chats ?? [],
    };
  }

  public async gePatientRecentMeasurement(patientId: string) {
    return this.prisma.patient.findFirst({
      where: {
        user_id: patientId,
      },

      select: {
        measurements: {
          select: {
            id: true,
            values: true,
            status: true,
            mode: true,
            type: true,
            unit: true,
            reading_source: true,
            created_at: true,
          },

          orderBy: {
            created_at: 'desc',
          },
          distinct: 'type',
        },
      },
    });
  }

  public async getTelemedPatient(telemedId: string) {
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: telemedId,
      },

      select: {
        participants: {
          select: {
            user_id: true,
          },
          where: {
            user: {
              role: 'PATIENT',
            },
          },
        },
      },
    });

    if (appointment.participants.length) {
      return appointment.participants[0]?.user_id;
    }

    return null;
  }
}
