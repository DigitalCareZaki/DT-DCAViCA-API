import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { HelpersService } from 'src/helpers/helpers.service';
import { TelemedCreateDTO } from './dto';
import { TelemedActionDTO } from './dto/action.dto';
import { SendMailPayload } from '@types';

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
  SlotParent,
} from './types';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { SENDGRID_TEMPLATES } from 'src/constant';

@Injectable()
export class TelemedService {
  constructor(
    private prisma: PrismaService,
    private helperService: HelpersService,
    private mail: SendgridService,

  ) { }

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
        users: { connect: dto.users.map((user) => ({ id: user })) },
      },
    });

    const doctors = await this.prisma.user.findMany({
      where: {
        id: { in: dto.users },
        role: 'DOCTOR',
      },
      select: { email: true, username: true },
    });

    console.log('doctor >>>>>>>>>>>', doctors);

    if (doctors.length > 0) {
      doctors.forEach(async (doctor) => {
        const mailPayload = {
          to: [doctor.email],
          data: {
            subject: 'Appointment Invitation',
            doctorName: doctor.username,
            patientName: user.username,
            patientEmail: user.email,
            patientPhone: user.phone_number,
            patientComment: dto.description,
            link: `https://avica-frontend.vercel.app/patient/telemed/meetings/view/${appointment.id}`
          },
          templateId: SENDGRID_TEMPLATES.APPOINTMENT_INVITATION,
        } satisfies SendMailPayload;

        await this.mail.sendSgMail(mailPayload);
      });
    }

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

  public async calendar(userId: string): Promise<SlotParent> {
    // console.log(`Fetching calendar for user: ${userId}`);
    const existingSlotParent = await this.prisma.slotParent.findUnique({
      where: { id: userId },
      include: {
        slots: {
          include: {
            slots: true,
          },
        },
      },
    });

    if (existingSlotParent) {
      return existingSlotParent;
    }
    // console.log(`creating new`);

    await this.prisma.slotParent.create({
      data: {
        id: userId,
      },
    });

    // Separately create SlotWrappers
    await Promise.all(
      [0, 1, 2, 3, 4, 5, 6].map((day) =>
        this.prisma.slotWrapper.create({
          data: {
            day: day,
            slotParentId: userId,
          },
        }),
      ),
    );

    // If you want to fetch the complete data afterwards
    const completeSlotParent = await this.prisma.slotParent.findUnique({
      where: { id: userId },
      include: {
        slots: {
          include: {
            slots: true,
          },
        },
      },
    });

    // console.log(`New SlotParent created for user ${userId}`);
    return completeSlotParent;
  }

  public async updateCalendar(
    user: UserRes,
    data: SlotParent,
  ): Promise<SlotParent> {
    // console.log(`Updating calendar 100% for user: ${user.id}`);

    // Fetch existing SlotParent with all nested relations
    const existingSlotParent = await this.prisma.slotParent.findUnique({
      where: { id: user.id },
      include: {
        slots: {
          include: {
            slots: true,
          },
        },
      },
    });

    // If SlotParent doesn't exist, throw an error
    if (!existingSlotParent) {
      throw new Error(`SlotParent for user ${user.id} does not exist.`);
    }

    // Update the SlotParent fields
    await this.prisma.slotParent.update({
      where: { id: user.id },
      data: {
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    // Get list of current SlotWrapper IDs and Slot IDs from the existing data
    const existingWrapperIds = existingSlotParent.slots.map(
      (wrapper) => wrapper.id,
    );

    const newWrapperIds = data.slots.map((wrapper) => wrapper.id);

    // Identify and delete SlotWrappers that are missing in the incoming data
    const wrappersToDelete = existingWrapperIds.filter(
      (id) => !newWrapperIds.includes(id),
    );

    for (const wrapperId of wrappersToDelete) {
      await this.prisma.slotWrapper.delete({
        where: { id: wrapperId },
      });
    }

    // Process SlotWrappers: Update existing or create new ones
    for (const incomingWrapper of data.slots) {
      if (incomingWrapper.id) {
        // Update existing SlotWrapper
        await this.prisma.slotWrapper.update({
          where: { id: incomingWrapper.id },
          data: { day: incomingWrapper.day },
        });

        // Handle Slots within the SlotWrapper
        const existingSlotIds =
          existingSlotParent.slots
            .find((wrapper) => wrapper.id === incomingWrapper.id)
            ?.slots.map((slot) => slot.id) || [];
        const incomingSlotIds = incomingWrapper.slots.map((slot) => slot.id);

        // Delete slots that are missing in the incoming data
        const slotsToDelete = existingSlotIds.filter(
          (id) => !incomingSlotIds.includes(id),
        );

        for (const slotId of slotsToDelete) {
          await this.prisma.slot.delete({ where: { id: slotId } });
        }

        // Update existing slots and create new ones
        for (const incomingSlot of incomingWrapper.slots) {
          if (incomingSlot.id) {
            // Update existing slot
            await this.prisma.slot.update({
              where: { id: incomingSlot.id },
              data: {
                startTime: incomingSlot.startTime,
                endTime: incomingSlot.endTime,
              },
            });
          } else {
            // Create new slot
            await this.prisma.slot.create({
              data: {
                startTime: incomingSlot.startTime,
                endTime: incomingSlot.endTime,
                slotWrapperId: incomingWrapper.id,
              },
            });
          }
        }
      } else {
        // Create new SlotWrapper if it doesn't exist
        const newWrapper = await this.prisma.slotWrapper.create({
          data: {
            day: incomingWrapper.day,
            slotParentId: user.id,
          },
        });

        // Create new slots for this new SlotWrapper
        for (const newSlot of incomingWrapper.slots) {
          await this.prisma.slot.create({
            data: {
              startTime: newSlot.startTime,
              endTime: newSlot.endTime,
              slotWrapperId: newWrapper.id,
            },
          });
        }
      }
    }

    // Fetch and return the fully updated SlotParent with all nested data
    const updatedSlotParent = await this.prisma.slotParent.findUnique({
      where: { id: user.id },
      include: {
        slots: {
          include: {
            slots: true,
          },
        },
      },
    });

    // console.log(`Calendar fully updated for user ${user.id}`);
    return updatedSlotParent;
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
