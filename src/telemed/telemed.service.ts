import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TelemedCreateDTO } from './dto';
import { TelemedActionDTO, TelemedRatingDTO } from './dto/action.dto';
import { SendMailPayload } from '@types';
import type { UserRes } from '@types';
import { Cron } from '@nestjs/schedule';

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
  AppointmentReport,
} from './types';
import { SendgridService } from 'src/sendGrid/sendgrid.service';
import { SENDGRID_TEMPLATES } from 'src/constant';
import { TwilioService } from 'src/twilio/twilio.service';
import { Role } from '@prisma/client';
import { ExceptionsHandler } from '@nestjs/core/exceptions/exceptions-handler';
import { userInfo } from 'os';

@Injectable()
export class TelemedService {
  constructor(private prisma: PrismaService, private mail: SendgridService, private sms: TwilioService) { }






  private generateTenMinuteSlots(start: Date, end: Date) {
    const slots = [];
    let current = new Date(start);

    while (current < end) {
      const next = new Date(current.getTime() + 10 * 60000);

      if (next > end) break;

      slots.push({
        startTime: new Date(current),
        endTime: new Date(next),
      });

      current = next;
    }

    return slots;
  }
  isOverlapping(start1: number, end1: number, start2: number, end2: number) {
    return start1 < end2 && end1 > start2;
  }

  private applyDate(base: Date, target: Date): Date {
    return new Date(Date.UTC(
      target.getUTCFullYear(),
      target.getUTCMonth(),
      target.getUTCDate(),
      base.getUTCHours(),
      base.getUTCMinutes(),
      base.getUTCSeconds(),
      base.getUTCMilliseconds()
    ));
  }

  // private applyDate(base: Date, target: Date): Date {
  //   console.log('Applying date=============>>>>>', base, target);
  //   return new Date(
  //     target.getFullYear(),
  //     target.getMonth(),
  //     target.getDate(),
  //     base.getHours(),
  //     base.getMinutes(),
  //     base.getSeconds(),
  //     base.getMilliseconds()
  //   );
  // }

  startOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  endOfDay(date: Date) {
    const d = new Date(date);
    d.setHours(23, 59, 59, 999);
    return d;
  }

  private startOfDayPKTToUTC(date: Date) {
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate() - 1,
      19, 0, 0, 0
    ));
  }

  private endOfDayPKTToUTC(date: Date) {
    return new Date(Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      19, 0, 0, 0
    ));
  }


  pkToUtc(date: string | Date) {
    const d = new Date(date);
    return new Date(d.getTime() - (5 * 60 * 60 * 1000));
  }

  // public async createAppointment(user: UserRes, dto: TelemedCreateDTO) {

  //   const startDate = new Date(dto.start_date);
  //   const endDate = new Date(dto.end_date);

  //   console.log('Service====>>Creating telemed appointment with data:', dto);

  //   const appointment = await this.prisma.appointment.create({
  //     data: {
  //       title: dto.title,
  //       description: dto.description,
  //       start_date: startDate,
  //       end_date: endDate,
  //       type: dto.type,
  //       about: dto.about,
  //       organizer_id: user.id,  // patient id
  //     },
  //   });

  //   console.log('appointment >>>>>>>>>>>', appointment.id);

  //   await this.prisma.appointmentParticipants.create({
  //     data: {
  //       status: 'PENDING',
  //       user_id: user.id,
  //       appointment_id: appointment.id,
  //     },
  //   });

  //   // dto.users is doctor id
  //   if (dto.users.length > 0) {
  //     dto.users.forEach(async (user) => {
  //       console.log(user, '===========>>>user')
  //       await this.prisma.appointmentParticipants.create({
  //         data: {
  //           status: 'PENDING',
  //           user_id: user,
  //           appointment_id: appointment.id,
  //         },
  //       });

  //     });

  //     // await this.prisma.$transaction(records);
  //   }
  //   await this.prisma.room.create({
  //     data: {
  //       appointment_id: appointment.id,
  //       users: { connect: dto.users.map((user) => ({ id: user })) },
  //     },
  //   });

  //   const doctors = await this.prisma.user.findMany({
  //     where: {
  //       id: { in: dto.users }
  //       // role: 'DOCTOR',
  //     },
  //     select: { id: true, email: true, username: true, phone_number: true },
  //   });

  //   console.log('doctor >>>>>>>>>>>', doctors);

  //   if (doctors.length > 0) {
  //     doctors.forEach(async (doctor) => {

  //       // send sms to doctor via Twilio
  //       const message = `New appointment request. Please check AViCA`;
  //       await this.sms.sendSMS(doctor.phone_number, message);

  //       // Save the SMS log to the database
  //       await this.prisma.sms.create({
  //         data: {
  //           receiver_id: doctor.id,
  //           sender_id: user.id,
  //           to: doctor.phone_number,
  //           body: message,
  //         },
  //       });

  //       // send email to doctor via Sendgrid
  //       const mailPayload = {
  //         to: [doctor.email],
  //         // to: [doctor.email],
  //         data: {
  //           subject: 'Appointment Invitation',
  //           doctorName: doctor.username,
  //           patientName: user.username,
  //           patientEmail: user.email,
  //           patientPhone: user.phone_number,
  //           patientComment: dto.description,
  //           link: `https://avica.health/doctor/telemed`
  //           // link: `https://avica-frontend.vercel.app/patient/telemed/meetings/view/${appointment.id}`
  //         },
  //         templateId: SENDGRID_TEMPLATES.APPOINTMENT_INVITATION,
  //       } satisfies SendMailPayload;

  //       await this.mail.sendSgMail(mailPayload);
  //     });
  //   }

  //   return appointment;
  // }

  public async createAppointment(user: UserRes, dto: TelemedCreateDTO) {
    const startDate = new Date(dto.start_date);
    const endDate = new Date(dto.end_date);

    console.log(
      'Service====>>Creating telemed appointment with data:',
      dto,
    );

    let appointment;

    try {
      console.log('Attempting to create appointment...');
      console.log('Appointment data:', {
        title: dto.title,
        description: dto.description,
        start_date: startDate,
        end_date: endDate,
        type: dto.type,
        about: dto.about,
        organizer_id: user.id,
      });

      appointment = await this.prisma.appointment.create({
        data: {
          title: dto.title,
          description: dto.description,
          start_date: startDate,
          end_date: endDate,
          type: dto.type,
          about: dto.about,
          organizer_id: user.id, // patient id
        },
      });

      console.log(
        'Appointment created successfully >>>>>>>>>>>',
        appointment,
      );
    } catch (error: any) {
      console.error(
        '================ APPOINTMENT CREATE ERROR ================',
      );

      console.error('Error:', error);
      console.error('Error name:', error?.name);
      console.error('Error message:', error?.message);
      console.error('Prisma error code:', error?.code);
      console.error('Prisma error meta:', error?.meta);

      console.error(
        '==========================================================',
      );

      // Re-throw so NestJS knows appointment creation failed
      throw error;
    }

    console.log('appointment >>>>>>>>>>>', appointment.id);

    await this.prisma.appointmentParticipants.create({
      data: {
        status: 'PENDING',
        user_id: user.id,
        appointment_id: appointment.id,
      },
    });

    // dto.users is doctor id
    if (dto.users.length > 0) {
      dto.users.forEach(async (user) => {
        console.log(user, '===========>>>user');

        await this.prisma.appointmentParticipants.create({
          data: {
            status: 'PENDING',
            user_id: user,
            appointment_id: appointment.id,
          },
        });
      });

      // await this.prisma.$transaction(records);
    }

    await this.prisma.room.create({
      data: {
        appointment_id: appointment.id,
        users: {
          connect: dto.users.map((user) => ({
            id: user,
          })),
        },
      },
    });

    const doctors = await this.prisma.user.findMany({
      where: {
        id: {
          in: dto.users,
        },
        // role: 'DOCTOR',
      },
      select: {
        id: true,
        email: true,
        username: true,
        phone_number: true,
      },
    });

    console.log('doctor >>>>>>>>>>>', doctors);

    if (doctors.length > 0) {
      doctors.forEach(async (doctor) => {
        // send sms to doctor via Twilio
        const message =
          'New appointment request. Please check AViCA';

        await this.sms.sendSMS(
          doctor.phone_number,
          message,
        );

        // Save the SMS log to the database
        await this.prisma.sms.create({
          data: {
            receiver_id: doctor.id,
            sender_id: user.id,
            to: doctor.phone_number,
            body: message,
          },
        });

        // send email to doctor via Sendgrid
        const mailPayload = {
          to: [doctor.email],
          data: {
            subject: 'Appointment Invitation',
            doctorName: doctor.username,
            patientName: user.username,
            patientEmail: user.email,
            patientPhone: user.phone_number,
            patientComment: dto.description,
            link: 'https://avica.health/doctor/telemed',
          },
          templateId:
            SENDGRID_TEMPLATES.APPOINTMENT_INVITATION,
        } satisfies SendMailPayload;

        await this.mail.sendSgMail(mailPayload);
      });
    }

    return appointment;
  }

  public async getAppointments(id: string) {
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

  public async getbranchTelemed(branchId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const whereCondition = {
      participants: {
        some: {
          user: {
            associated_branches: {
              some: {
                id: branchId, // match the branch you want
              },
            },
          },
        },
      },
    }
    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        skip,
        take: limit,
        where: whereCondition,
        include: {
          participants: {
            include: {
              user: true,
            },
          },
        },
      }),
      this.prisma.appointment.count({ where: whereCondition })

    ]);
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
      data: data,
      pagination: {
        totalItems,
        perPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };
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
    currentUser: UserRes,
    branchId: string
  ): Promise<SearchResProps[]> {
    console.log(currentUser, 'currentUser=================>>>')
    if (currentUser.role === Role.NURSE) {
      return await this.prisma.user.findMany({
        where: {
          AND: [
            {
              associated_branches: {
                some: {
                  id: branchId,
                },
              },
            },
            {
              role: 'DOCTOR',
            },
          ],
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          middle_name: true,
        }
      });
    }

    return await this.prisma.user.findMany({
      where: {
        AND: [
          // Only DOCTORS
          {
            role: Role.DOCTOR,
          },

          // Only doctors assigned to this patient
          {
            doctor: {
              patients: {
                some: {
                  user_id: currentUser.id,
                },
              },
            },
          },

          //  Search filters
          {
            OR: [
              { email: { contains: search, mode: 'insensitive' } },
              { first_name: { contains: search, mode: 'insensitive' } },
              { last_name: { contains: search, mode: 'insensitive' } },
              { middle_name: { contains: search, mode: 'insensitive' } },
            ],
          },

          //  Exclude self (extra safety)
          {
            NOT: { id: currentUser.id },
          },
        ],
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        middle_name: true,
      },
    });
  }

  // public async searchTelemed(
  //   search: string,
  //   currentUser: string,
  // ): Promise<SearchResProps[]> {
  //   return await this.prisma.user.findMany({
  //     where: {
  //       AND: [
  //         {
  //           email: {
  //             contains: search,
  //             mode: 'insensitive',
  //           },
  //         },
  //         {
  //           NOT: {
  //             id: currentUser,
  //           },
  //         },
  //         {
  //           OR: [
  //             {
  //               role: 'DOCTOR',
  //             },
  //             {
  //               role: 'NURSE',
  //             },
  //             {
  //               role: 'PATIENT',
  //             },
  //           ],
  //         },
  //       ],
  //     },

  //     select: {
  //       email: true,
  //       first_name: true,
  //       last_name: true,
  //       middle_name: true,
  //       id: true,
  //     },
  //   });
  // }

  public async requested(user: UserRes, isPending: boolean): Promise<RequestedAppointmentProps[]> {
    this.markPastAppointmentsCompleted();
    return this.prisma.appointmentParticipants.findMany({
      where: isPending
        ? { AND: [{ user_id: user.id }, { status: 'PENDING' }] }
        : { AND: [{ user_id: user.id }, { NOT: { status: 'PENDING' } }] },
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
            updated_at: true,
          },
        },
      },
      orderBy: {
        appointment: {
          updated_at: 'desc'  // Order by the most recently updated appointment
        }
      }
    });
  }




  public async patientAppointments(
    patientId: string,
    page = 1,
    limit = 10
  ): Promise<any> {
    const skip = (page - 1) * limit;

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.appointmentParticipants.findMany({
        where: {
          user_id: patientId,
        },
        skip,
        take: limit,
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
                  user: true,
                },
              },
              appointmentObservation: {
                select: {
                  id: true,
                  observations: true,
                  diagnosis: true,
                  medications: true,
                  procedure: true,
                  follow_up_date: true,
                },
              },
              created_at: true,
            },
          },
        },
      }),
      this.prisma.appointmentParticipants.count({
        where: {
          user_id: patientId,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }

  public async appointmentAnalytics(user: UserRes, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    let data: any[] = [];
    let totalItems = 0;

    if (user.role === 'DOCTOR') {
      [data, totalItems] = await this.prisma.$transaction([
        this.prisma.appointmentParticipants.findMany({
          where: { user_id: user.id },
          skip,
          take: limit,
          select: {
            id: true,
            status: true,
            appointment: {
              select: {
                id: true,
                title: true,
                description: true,
                about: true,
                type: true,
                status: true,
                start_date: true,
                organizer: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    middle_name: true,
                    role: true,
                  },
                },
                participants: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        middle_name: true,
                        role: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.appointmentParticipants.count({ where: { user_id: user.id } }),
      ]);

      // Normalize for doctor
      data = data.map(item => {
        const doctor = item.appointment.participants.find(p => p.user.role === 'DOCTOR')?.user;
        return {
          id: item.appointment.id,
          status: item.status,
          title: item.appointment.title,
          description: item.appointment.description,
          about: item.appointment.about,
          type: item.appointment.type,
          patientId: item.appointment.organizer.id,
          patient_name: `${item.appointment.organizer.first_name} ${item.appointment.organizer.last_name}`,
          doctorid: doctor?.id || null,
          doctor_name: doctor ? `${doctor.first_name} ${doctor.last_name}` : null,
          AppointmetDate: item.appointment.start_date,
        };
      });
    }

    if (user.role === 'PATIENT') {

      [data, totalItems] = await this.prisma.$transaction([
        this.prisma.appointmentParticipants.findMany({
          where: { user_id: user.id },
          skip,
          take: limit,
          select: {
            id: true,
            status: true,
            appointment: {
              select: {
                id: true,
                title: true,
                description: true,
                about: true,
                type: true,
                status: true,
                start_date: true,
                organizer: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    middle_name: true,
                    role: true,
                  },
                },
                participants: {
                  select: {
                    id: true,
                    user: {
                      select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        middle_name: true,
                        role: true,
                      },
                    },
                  },
                },
              },
            },
          },
        }),
        this.prisma.appointment.count({ where: { organizer_id: user.id } }),
      ]);
      //console.log('data:===========>>', JSON.stringify(data, null, 2));
      // Normalize for patient
      data = data.map(item => {
        const doctor = item.appointment.participants.find(p => p.user.role === 'DOCTOR')?.user;

        return {
          id: item.appointment.id,
          status: item.status,
          title: item.appointment.title,
          description: item.appointment.description,
          about: item.appointment.about,
          type: item.appointment.type,
          patientId: item.appointment.organizer.id,
          patient_name: `${item.appointment.organizer.first_name} ${item.appointment.organizer.last_name}`,
          doctorid: doctor?.id || null,
          doctor_name: doctor ? `${doctor.first_name} ${doctor.last_name}` : null,
          AppointmetDate: item.appointment.start_date,
        };
      });
    }
    console.log(data, 'data:===========>>');
    const totalPages = Math.ceil(totalItems / limit);

    return {
      Appointmentlist: data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }

  public async organizationAppointmentList(user: UserRes, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [data, totalItems] = await this.prisma.$transaction([
      this.prisma.appointment.findMany({
        where: {
          organizer: {
            organization_id: user.organization_id,

          },
        },
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          description: true,
          about: true,
          type: true,
          status: true,
          start_date: true,
          created_at: true,
          organizer: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              middle_name: true,
              role: true,
            },
          },
          participants: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  middle_name: true,
                  role: true,
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc', // optional now, frontend will sort
        },
      }),
      // this.prisma.appointmentParticipants.findMany({

      //   skip,
      //   take: limit,
      //   select: {
      //     id: true,
      //     status: true,
      //     created_at: true,
      //     appointment: {
      //       select: {
      //         id: true,
      //         title: true,
      //         description: true,
      //         about: true,
      //         type: true,
      //         status: true,
      //         start_date: true,
      //         organizer: {
      //           select: {
      //             id: true,
      //             first_name: true,
      //             last_name: true,
      //             middle_name: true,
      //             role: true,
      //           },
      //         },
      //         participants: {
      //           select: {
      //             id: true,
      //             user: {
      //               select: {
      //                 id: true,
      //                 first_name: true,
      //                 last_name: true,
      //                 middle_name: true,
      //                 role: true,
      //               },
      //             },
      //           },
      //         },
      //       },
      //     },
      //   },
      //   orderBy: {
      //     created_at: 'desc', // optional now, frontend will sort
      //   },
      // }),
      // this.prisma.appointmentParticipants.count({ where: { user_id: user.id } }),
      this.prisma.appointment.count({
        where: {
          organizer: {
            organization_id: user.organization_id,

          },
        },
      },)

    ])

    let appointmentList = data.map(item => {
      const doctor = item.participants.find(p => p.user.role === 'DOCTOR')?.user;

      return {
        id: item.id,
        status: item.status,
        title: item.title,
        description: item.description,
        about: item.about,
        type: item.type,
        patientId: item.organizer.id,
        patient_name: `${item.organizer.first_name} ${item.organizer.last_name}`,
        doctorid: doctor?.id || null,
        doctor_name: doctor ? `${doctor.first_name} ${doctor.last_name}` : null,
        AppointmetDate: item.start_date,
      };
    });

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: appointmentList,
      pagination: {
        totalItems,
        perPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
      },
    };

  }

  public async patientAppointmentList(user: UserRes) {
    const dt = await this.prisma.appointmentParticipants.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        status: true,
        created_at: true,
        appointment: {
          select: {
            id: true,
            title: true,
            description: true,
            about: true,
            type: true,
            status: true,
            start_date: true,
            organizer: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                middle_name: true,
                role: true,
              },
            },
            participants: {
              select: {
                id: true,
                user: {
                  select: {
                    id: true,
                    first_name: true,
                    last_name: true,
                    middle_name: true,
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        created_at: 'desc', // optional now, frontend will sort
      },
    });

    let appointmentList = dt.map(item => {
      const doctor = item.appointment.participants.find(p => p.user.role === 'DOCTOR')?.user;

      return {
        id: item.appointment.id,
        status: item.status,
        title: item.appointment.title,
        description: item.appointment.description,
        about: item.appointment.about,
        type: item.appointment.type,
        patientId: item.appointment.organizer.id,
        patient_name: `${item.appointment.organizer.first_name} ${item.appointment.organizer.last_name}`,
        doctorid: doctor?.id || null,
        doctor_name: doctor ? `${doctor.first_name} ${doctor.last_name}` : null,
        AppointmetDate: item.appointment.start_date,
      };
    });


    return appointmentList;
  }






  public async patientAppointmentAnalytics(user: UserRes, patientId: string) {

    let data: any[] = [];


    if (user.role === 'DOCTOR') {

      const dt = await this.prisma.appointmentParticipants.findMany({
        where: { user_id: patientId },

        select: {
          id: true,
          status: true,
          appointment: {
            select: {
              id: true,
              title: true,
              description: true,
              about: true,
              type: true,
              status: true,
              start_date: true,
              organizer: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  middle_name: true,
                  role: true,
                },
              },
              participants: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      middle_name: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc', // optional now, frontend will sort
        },
      }),
        // this.prisma.appointmentParticipants.count({ where: { user_id: user.id } }),


        // Normalize for doctor
        data = dt.map(item => {
          const doctor = item.appointment.participants.find(p => p.user.role === 'DOCTOR')?.user;
          return {
            id: item.appointment.id,
            status: item.status,
            title: item.appointment.title,
            description: item.appointment.description,
            about: item.appointment.about,
            type: item.appointment.type,
            patientId: item.appointment.organizer.id,
            patient_name: `${item.appointment.organizer.first_name} ${item.appointment.organizer.last_name}`,
            doctorid: doctor?.id || null,
            doctor_name: doctor ? `${doctor.first_name} ${doctor.last_name}` : null,
            AppointmetDate: item.appointment.start_date,
          };
        });

      return data;
    }

    if (user.role === 'PATIENT') {


      const dt = await this.prisma.appointmentParticipants.findMany({
        where: { user_id: patientId },
        select: {
          id: true,
          status: true,
          appointment: {
            select: {
              id: true,
              title: true,
              description: true,
              about: true,
              type: true,
              status: true,
              start_date: true,
              organizer: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  middle_name: true,
                  role: true,
                },
              },
              participants: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      middle_name: true,
                      role: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          created_at: 'desc', // optional now, frontend will sort
        },
      }),

        //console.log('data:===========>>', JSON.stringify(data, null, 2));
        // Normalize for patient
        data = dt.map(item => {
          const doctor = item.appointment.participants.find(p => p.user.role === 'DOCTOR')?.user;

          return {
            id: item.appointment.id,
            status: item.status,
            title: item.appointment.title,
            description: item.appointment.description,
            about: item.appointment.about,
            type: item.appointment.type,
            patientId: item.appointment.organizer.id,
            patient_name: `${item.appointment.organizer.first_name} ${item.appointment.organizer.last_name}`,
            doctorid: doctor?.id || null,
            doctor_name: doctor ? `${doctor.first_name} ${doctor.last_name}` : null,
            AppointmetDate: item.appointment.start_date,
          };
        });
      return data;
    }

  }

  public async appointmentList(user: UserRes, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    let data: any[] = [];
    let totalItems = 0;

    [data, totalItems] = await this.prisma.$transaction([
      this.prisma.appointmentParticipants.findMany({
        where: { user_id: user.id },
        orderBy: {
          appointment: {
            start_date: 'desc',
          },
        },
        skip,
        take: limit,
        select: {
          id: true,
          status: true,
          appointment: {
            select: {
              id: true,
              title: true,
              description: true,
              about: true,
              rating: true,
              type: true,
              status: true,
              start_date: true,
              organizer: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  middle_name: true,
                  role: true,
                },
              },
              participants: {
                select: {
                  id: true,
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      last_name: true,
                      middle_name: true,
                      role: true,
                    },
                  },
                },
              },
              appointmentObservation: {
                select: {
                  id: true,
                  observations: true,
                  diagnosis: true,
                  medications: true,
                  procedure: true,
                  follow_up_date: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.appointmentParticipants.count({ where: { user_id: user.id } }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      data,
      pagination: {
        totalItems,
        totalPages,
        currentPage: page,
        perPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
        nextPage: page < totalPages ? page + 1 : null,
        prevPage: page > 1 ? page - 1 : null,
      },
    };
  }

  public async appointmentAnalyticsGroup(user: UserRes) {
    const statusLabels: Record<string, string> = {
      'ACTIVE': 'Active',
      'COMPLETED': 'Complete',
      'PENDING': 'Pending',
      'CANCELLED': 'Canceled',
      // Add other statuses if needed
    };

    const result: Record<string, string> = {
      'Active': '0',
      'Complete': '0',
      'Pending': '0',
      'Canceled': '0',
      'Total': '0', // Added total field
    };

    const appointments = await this.prisma.appointmentParticipants.groupBy({
      by: ['status'],
      where: {
        user_id: user.id,
      },
      _count: {
        status: true,
      },
    });

    let total = 0;

    appointments.forEach(item => {
      const label = statusLabels[item.status];
      if (label) {
        const count = item._count.status;
        result[label] = count.toString();
        total += count;
      }
    });

    result['Total'] = total.toString();

    return result;
  }
  public async PatientAppointmentAnalyticsGroup(user: UserRes, patientId: string) {
    const statusLabels: Record<string, string> = {
      'ACTIVE': 'Active',
      'COMPLETED': 'Complete',
      'PENDING': 'Pending',
      'CANCELLED': 'Canceled',
      // Add other statuses if needed
    };

    const result: Record<string, string> = {
      'Active': '0',
      'Complete': '0',
      'Pending': '0',
      'Canceled': '0',
      'Total': '0', // Added total field
    };

    const appointments = await this.prisma.appointmentParticipants.groupBy({
      by: ['status'],
      where: {
        user_id: patientId,
      },
      _count: {
        status: true,
      },
    });

    let total = 0;

    appointments.forEach(item => {
      const label = statusLabels[item.status];
      if (label) {
        const count = item._count.status;
        result[label] = count.toString();
        total += count;
      }
    });

    result['Total'] = total.toString();

    return result;
  }
  // public async appointmentAnalyticsGroup(user: UserRes) {
  //   const statusLabels: Record<string, string> = {
  //     'ACTIVE': 'Active',
  //     'COMPLETED': 'Complete',
  //     'PENDING': 'Pending',
  //     'CANCELLED': 'Canceled',
  //     // Add other statuses if needed
  //   };

  //   const result: Record<string, string> = {
  //     'Active': '0',
  //     'Complete': '0',
  //     'Pending': '0',
  //     'Canceled': '0',
  //   };

  //   const appointments = await this.prisma.appointment.groupBy({
  //     by: ['status'],
  //     where: {
  //       OR: [
  //         { organizer: { id: user.id } },
  //         { participants: { some: { user_id: user.id } } },
  //       ],
  //     },
  //     _count: {
  //       status: true,
  //     },
  //   });

  //   appointments.forEach(item => {
  //     const label = statusLabels[item.status];
  //     if (label) {
  //       result[label] = item._count.status.toString();
  //     }
  //   });

  //   return result;
  // }

  public async todayappointments(user: UserRes) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const todayAppointments = await this.prisma.appointmentParticipants.findMany({
      where: {
        user_id: user.id,
        appointment: {
          start_date: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
      },
      select: {
        status: true,
      },
    });
    const totalAppointments = await this.prisma.appointmentParticipants.findMany({
      where: {
        user_id: user.id
      },
      select: {
        status: true,
      },
    });

    const counts = {
      totalAppointments: totalAppointments.length,
      active: 0,
      scheduled: 0,
      cancelled: 0,
    };

    todayAppointments.forEach((appointment) => {
      if (appointment.status === 'ACTIVE') counts.active++;
      if (appointment.status === 'ONGOING') counts.scheduled++;
      if (appointment.status === 'CANCELLED') counts.cancelled++;
    });

    return counts;

  }

  // public async calendar(userId: string) {
  //   let slotParent = await this.prisma.slotParent.findUnique({
  //     where: { id: userId },
  //     include: {
  //       slots: {
  //         include: {
  //           slots: true,
  //         },
  //       },
  //     },
  //   });

  //   // 🔹 YOUR LOGIC — KEEP IT
  //   if (!slotParent) {
  //     await this.prisma.slotParent.create({
  //       data: { id: userId },
  //     });

  //     await Promise.all(
  //       [0, 1, 2, 3, 4, 5, 6].map((day) =>
  //         this.prisma.slotWrapper.create({
  //           data: {
  //             day,
  //             slotParentId: userId,
  //           },
  //         }),
  //       ),
  //     );

  //     slotParent = await this.prisma.slotParent.findUnique({
  //       where: { id: userId },
  //       include: {
  //         slots: {
  //           include: {
  //             slots: true,
  //           },
  //         },
  //       },
  //     });
  //   }

  //   // 🔹 TRANSFORM RESPONSE (10-minute slots)
  //   return {
  //     id: slotParent.id,
  //     startTime: slotParent.startTime,
  //     endTime: slotParent.endTime,
  //     days: slotParent.slots.map(wrapper => ({
  //       day: wrapper.day,
  //       slots: wrapper.slots.flatMap(slot =>
  //         this.generateTenMinuteSlots(
  //           new Date(slot.startTime),
  //           new Date(slot.endTime),
  //         ),
  //       ),
  //     })),
  //   };
  // }
  public async getSlotsByDate(userId: string, dateStr: string) {
    try {
      const date = new Date(dateStr);
      const day = date.getDay();

      const slotParent = await this.prisma.slotParent.findUnique({
        where: { id: userId },
        include: {
          slots: { include: { slots: true } }
        }
      });

      if (!slotParent) return null;

      const wrapper = slotParent.slots.find(w => w.day === day);
      if (!wrapper) {
        return { date: dateStr, day, slots: [] };
      }

      // STEP 1 — Generate Raw Slots & Convert Doctor Local → UTC
      const generatedSlots = wrapper.slots.flatMap(slot => {
        const slotStart = this.applyDate(new Date(slot.startTime), date);
        const slotEnd = this.applyDate(new Date(slot.endTime), date);
        console.log('Slot Start:', slotStart, 'Slot End:', slotEnd);
        return this.generateTenMinuteSlots(slotStart, slotEnd).map(s => ({
          startTime: new Date(s.startTime),
          endTime: new Date(s.endTime)
        }));
      });


      // STEP 2 — Normalize Slots before filtering
      const normalizedSlots = generatedSlots.map(s => ({
        startTime: new Date(s.startTime.toISOString()),
        endTime: new Date(s.endTime.toISOString())
      }));

      // STEP 3 — Fetch appointments for that same day
      console.log('Fetching appointments for user:', userId, 'on date:', date);
      const appointments = await this.prisma.appointment.findMany({
        where: {
          participants: { some: { user_id: userId } },
          start_date: { gte: this.startOfDayPKTToUTC(date), lt: this.endOfDayPKTToUTC(date) },
          status: { not: 'CANCELLED' }   // 👈 this line excludes cancelled appointments
        },
        select: { start_date: true, end_date: true }
      });

      console.log('Appointments ====>>>', appointments);
      console.log('normalizedSlots ====>>>', normalizedSlots);

      // STEP 4 — Filter Out Booked Slots (UTC → UTC compare)
      const availableSlots = normalizedSlots.filter(slot => {
        if (!appointments || appointments.length === 0) return true;

        return !appointments.some(appt => {
          const PKT_OFFSET = 5 * 60 * 60 * 1000;

          const apptStartPKT = new Date(appt.start_date.getTime() + PKT_OFFSET);
          const apptEndPKT = new Date(appt.end_date.getTime() + PKT_OFFSET);

          const apptStart = apptStartPKT.getTime();
          const apptEnd = apptEndPKT.getTime();
          const slotStart = slot.startTime.getTime();
          const slotEnd = slot.endTime.getTime();

          return this.isOverlapping(slotStart, slotEnd, apptStart, apptEnd);
        });
      });


      return {
        date: dateStr,
        day,
        slots: availableSlots.map(s => ({
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString()
        }))
      };

    } catch (err) {
      console.log(err);
      throw err;
    }
  }



  public async calendar(userId: string): Promise<SlotParent> {
    console.log(`Fetching calendar for user: ${userId}`);
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

  public async createReport(
    user: UserRes,
    data: AppointmentReport,
  ): Promise<AppointmentReport> {
    // Fetch the appointment with existing observation (if any)
    const existingAppointment = await this.prisma.appointment.findUnique({
      where: { id: data.appointmentId },
      include: {
        appointmentObservation: true,
      },
    });

    if (!existingAppointment) {
      throw new Error(`Appointment with ID ${data.appointmentId} does not exist.`);
    }

    let observation;

    // If observation exists, update it
    if (existingAppointment.appointmentObservation) {
      observation = await this.prisma.appointmentObservation.update({
        where: { id: existingAppointment.appointmentObservation.id },
        data: {
          observations: data.observations,
          diagnosis: data.diagnosis,
          medications: data.medications,
          procedure: data.procedure,
          follow_up_date: new Date(data.follow_up_date),
        },
      });
    } else {
      //  If no observation exists, create one and link it
      observation = await this.prisma.appointmentObservation.create({
        data: {
          observations: data.observations,
          diagnosis: data.diagnosis,
          medications: data.medications,
          procedure: data.procedure,
          follow_up_date: data.follow_up_date,
          appointment: {
            connect: { id: data.appointmentId },
          },
        },
      });

      // Link the new observation to the appointment
      await this.prisma.appointment.update({
        where: { id: data.appointmentId },
        data: {
          appointmentObservation_id: observation.id,
        },
      });
    }

    // Return the final observation
    return {
      ...data,
      id: observation.id,
    };
  }

  // public async updateCalendar(
  //   user: UserRes,
  //   data: SlotParent,
  // ): Promise<SlotParent> {
  //   // console.log(`Updating calendar 100% for user: ${user.id}`);
  //   console.log(data, 'data:===========>>');
  //   // Fetch existing SlotParent with all nested relations
  //   const existingSlotParent = await this.prisma.slotParent.findUnique({
  //     where: { id: user.id },
  //     include: {
  //       slots: {
  //         include: {
  //           slots: true,
  //         },
  //       },
  //     },
  //   });

  //   // If SlotParent doesn't exist, throw an error
  //   if (!existingSlotParent) {
  //     throw new Error(`SlotParent for user ${user.id} does not exist.`);
  //   }

  //   // Update the SlotParent fields
  //   await this.prisma.slotParent.update({
  //     where: { id: user.id },
  //     data: {
  //       startTime: data.startTime,
  //       endTime: data.endTime,
  //     },
  //   });

  //   // Get list of current SlotWrapper IDs and Slot IDs from the existing data
  //   const existingWrapperIds = existingSlotParent.slots.map(
  //     (wrapper) => wrapper.id,
  //   );

  //   const newWrapperIds = data.slots.map((wrapper) => wrapper.id);

  //   // Identify and delete SlotWrappers that are missing in the incoming data
  //   const wrappersToDelete = existingWrapperIds.filter(
  //     (id) => !newWrapperIds.includes(id),
  //   );

  //   for (const wrapperId of wrappersToDelete) {
  //     await this.prisma.slotWrapper.delete({
  //       where: { id: wrapperId },
  //     });
  //   }

  //   // Process SlotWrappers: Update existing or create new ones
  //   console.log(JSON.stringify(data.slots, null, 2), 'data.slots:===========>>');
  //   for (const incomingWrapper of data.slots) {
  //     if (incomingWrapper.id) {
  //       // Update existing SlotWrapper
  //       await this.prisma.slotWrapper.update({
  //         where: { id: incomingWrapper.id },
  //         data: { day: incomingWrapper.day },
  //       });

  //       // Handle Slots within the SlotWrapper
  //       const existingSlotIds =
  //         existingSlotParent.slots
  //           .find((wrapper) => wrapper.id === incomingWrapper.id)
  //           ?.slots.map((slot) => slot.id) || [];
  //       const incomingSlotIds = incomingWrapper.slots.map((slot) => slot.id);

  //       // Delete slots that are missing in the incoming data
  //       const slotsToDelete = existingSlotIds.filter(
  //         (id) => !incomingSlotIds.includes(id),
  //       );

  //       for (const slotId of slotsToDelete) {
  //         await this.prisma.slot.delete({ where: { id: slotId } });
  //       }

  //       // Update existing slots and create new ones
  //       for (const incomingSlot of incomingWrapper.slots) {
  //         if (incomingSlot.id) {
  //           // Update existing slot new Date(dto.start_date);
  //           await this.prisma.slot.update({
  //             where: { id: incomingSlot.id },
  //             data: {
  //               startTime: this.pkToUtc(incomingSlot.startTime),
  //               endTime: this.pkToUtc(incomingSlot.endTime),
  //             }
  //           });
  //         } else {
  //           // Create new slot
  //           await this.prisma.slot.create({
  //             data: {
  //               startTime: this.pkToUtc(incomingSlot.startTime),
  //               endTime: this.pkToUtc(incomingSlot.endTime),
  //               slotWrapperId: incomingWrapper.id,
  //             },
  //           });
  //         }
  //       }
  //     } else {
  //       // Create new SlotWrapper if it doesn't existasdfasd
  //       const newWrapper = await this.prisma.slotWrapper.create({
  //         data: {
  //           day: incomingWrapper.day,
  //           slotParentId: user.id,
  //         },
  //       });

  //       // Create new slots for this new SlotWrapper
  //       for (const newSlot of incomingWrapper.slots) {
  //         await this.prisma.slot.create({
  //           data: {
  //             startTime: this.pkToUtc(newSlot.startTime),
  //             endTime: this.pkToUtc(newSlot.endTime),
  //             slotWrapperId: newWrapper.id,
  //           },
  //         });
  //       }
  //     }
  //   }

  //   // Fetch and return the fully updated SlotParent with all nested data
  //   const updatedSlotParent = await this.prisma.slotParent.findUnique({
  //     where: { id: user.id },
  //     include: {
  //       slots: {
  //         include: {
  //           slots: true,
  //         },
  //       },
  //     },
  //   });

  //   // console.log(`Calendar fully updated for user ${user.id}`);
  //   return updatedSlotParent;
  // }
  public async updateCalendar(
    user: UserRes,
    data: SlotParent,
  ): Promise<SlotParent> {
    // console.log(`Updating calendar 100% for user: ${user.id}`);
    console.log(data, 'data:===========>>');
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
    console.log(data.slots, 'data.slots:===========>>');
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
            // Update existing slot new Date(dto.start_date);
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
        // Create new SlotWrapper if it doesn't existasdfasd
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

    console.log('id: >>>>>>>>', data);
    const appointments = await this.prisma.appointmentParticipants.findMany({
      where: {
        appointment_id: data.id,
      },
      select: {
        id: true,
      },
    });
    console.log('appointments: >>>>>>>>', appointments);
    const appointment = await this.prisma.appointment.findFirst({
      where: {
        id: data.id,
      },
      select: {
        id: true,
        start_date: true,
        participants: {
          select: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                phone_number: true,
                role: true,
                email: true,
              },
            },
          },
        },
      },
    });
    console.log('appointment: >>>>>>>>', appointment);
    if (appointment?.id) {

      // update appointment status
      await this.prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: data.status },
      });

      // format date (only date)
      const formattedDate = new Date(appointment.start_date).toLocaleDateString("en-PK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      // send sms to patient
      for (const participant of appointment.participants) {
        console.log('participant: >>>>>>>>', participant);
        if (participant.user.role === "PATIENT" || participant.user.role === "NURSE") {

          const message = `Your appointment scheduled on ${formattedDate} has been ${data.status.toLowerCase()}.`;

          await this.sms.sendSMS(
            participant.user.phone_number,
            message
          );

          // send email to doctor via Sendgrid
          const mailPayload = {
            to: [participant.user.email],
            data: {
              subject: 'Appointment status update',
              message: `Your appointment scheduled on ${formattedDate} has been ${data.status.toLowerCase()}.`,
            },
            templateId: SENDGRID_TEMPLATES.APPOINTMENT_STATUS_UPDATE,
          } satisfies SendMailPayload;

          await this.mail.sendSgMail(mailPayload);
        }
        const doctor = appointment.participants.find(p => p.user.role === 'DOCTOR')?.user;
        const patient = appointment.participants.find(p => p.user.role === 'PATIENT')?.user;
        const nurse = appointment.participants.find(p => p.user.role === 'NURSE')?.user;
        await this.prisma.sms.create({
          data: {
            receiver_id: appointment.participants.find(p => p.user.role === 'PATIENT')?.user.id || nurse?.id,
            sender_id: doctor.id,
            to: doctor.phone_number,
            body: "Appointment status update",
          },
        });
      }

    }

    if (appointments.length > 0) {
      const updatePromises = appointments.map(appoint =>
        this.prisma.appointmentParticipants.update({
          where: { id: appoint.id },
          data: { status: data.status },
        })
      );

      await Promise.allSettled(updatePromises);
      return {
        updated: true,
      };
    }
    return {
      updated: false,
    };

  }


  public async markPastAppointmentsCompleted(): Promise<{ updatedCount: number }> {
    try {
      const nowUTC = new Date(new Date().toISOString());
      const result = await this.prisma.appointment.updateMany({
        where: {
          start_date: { lt: nowUTC },
          end_date: { lt: nowUTC },
          status: { not: 'COMPLETED' },
        },
        data: {
          status: 'COMPLETED',
        },
      });
      if (result.count > 0) {
        const pastAppointments = await this.prisma.appointment.findMany({
          where: {
            start_date: { lt: nowUTC },
            end_date: { lt: nowUTC },
          },
          select: { id: true },
        });

        const appointmentIds = pastAppointments.map(a => a.id);
        console.log('Past Appointment IDs:', appointmentIds);
        if (appointmentIds.length > 0) {
          const result = await this.prisma.appointmentParticipants.updateMany({
            where: {
              appointment_id: { in: appointmentIds },
              status: { not: 'COMPLETED' },
            },
            data: {
              status: 'COMPLETED',
            },
          });

        }
        return {
          updatedCount: result.count,
        };
      }
    } catch (error) {
      console.error('Error marking past appointments as completed:', error);
    }
  }


  public async details(id: string) {
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
        appointmentObservation: {
          select: {
            id: true,
            observations: true,
            diagnosis: true,
            medications: true,
            procedure: true,
            follow_up_date: true,
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

  async appointmentRating(data: TelemedRatingDTO) {

    // validation
    if (data.rating < 1 || data.rating > 5) {
      throw new BadRequestException("Rating must be between 1 and 5");
    }

    return this.prisma.appointment.update({
      where: {
        id: data.id,
      },
      data: {
        rating: data.rating,
      },
    });
  }



}
