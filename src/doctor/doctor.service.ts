/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, HttpStatus, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import * as argon from 'argon2';

import { PrismaService } from 'src/prisma/prisma.service';
import { HelpersService } from 'src/helpers/helpers.service';

import { AppError } from 'src/errors';

import { DoctorProfileUpdateDto } from './dto';
import { AddDoctoreDTO } from 'src/organization/dto';
import { ContactDTO } from 'src/common/dto';

import type {
  ProfileRes,
  CurrentRes,
  Patients,
  PatientProfile,
  PatientContacts,
  PatientContact,
  PatientDoctors,
  PatientNurses,
  GetNurses,
  OrganizationMedication,
  DoctorStats,
} from './types';
import type { JsonRes } from '@types';

@Injectable()
export class DoctorService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private helperService: HelpersService,
  ) { }

  public async profile(id: string): Promise<ProfileRes> {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
      select: {
        id: true,
        first_name: true,
        middle_name: true,
        last_name: true,
        dob: true,
        uri: true,
        role: true,
        gender: true,
        title: true,
        email: true,
        phone_number: true,
        username: true,
        pincode: true,
        associated_branches: {
          select: {
            id: true,
            name: true,
          },
        },
        location: {
          include: {
            city: {
              include: {
                country: true,
              },
            },
          },
        },
        doctor: {
          include: {
            specialities: true,
            departments: true,
          },
        },
        created_at: true,
        updated_at: true,
        active: true,
      },
    });
  }

  public async updateProfile(
    id: string,
    data: DoctorProfileUpdateDto,
  ): Promise<any> {

    console.log(data, 'data in updateProfile');
    try {
      const user = await this.prisma.user.update({
        where: {
          id,
        },

        data: {
          title: data.title,
          first_name: data.first_name,
          last_name: data.last_name,
          middle_name: data.middle_name,
          phone_number: data.phone_number,
          uri: data.uri,
          location: {
            update: {
              address: data.address,
            },
          },
        },
      });
      console.log('User profile updated successfully:', user);
      return user


    } catch (error) {
      console.error('Error updating user profile:', error);
    }

    // return await this.prisma.user.update({
    //   where: {
    //     id,
    //   },

    //   data: {
    //     title: data.title,
    //     first_name: data.first_name,
    //     last_name: data.last_name,
    //     middle_name: data.middle_name,
    //     phone_number: data.phone_number,
    //     uri: data.uri,
    //     location: {
    //       update: {
    //         address: data.address,
    //       },
    //     },
    //   },
    // });
  }

  public async current(id: string): Promise<CurrentRes> {
    return await this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        middle_name: true,
        uri: true,
        email: true,
        username: true,
        title: true,
        role: true,
        user_meta_data: {
          select: {
            ip_address: true,
            device_info: true,
            os: true,
            last_access: true,
          },
        },
      },
    });
  }

  public async patients(id: string): Promise<Patients> {
    const pateintlist = await this.prisma.doctor
      .findUniqueOrThrow({
        where: {
          user_id: id,
        },
      })
      .patients({
        orderBy: {
          created_at: 'desc',
        },
        select: {
          emr: true,
          user: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              email: true,
              uri: true,
              phone_number: true,
            },
          },
        },
      });
    console.log(pateintlist, 'pateintlist');
    return pateintlist;
  }

  // public async patients(
  //   id: string,
  //   page: number = 1,
  //   pageSize: number = 10
  // ): Promise<{ data: Patients; meta: { total: number; page: number; pageSize: number; pageCount: number } }> {
  //   // Calculate skip value based on page and pageSize
  //   const skip = (page - 1) * pageSize;

  //   // Get patients with pagination
  //   const pateintlist = await this.prisma.doctor
  //     .findUniqueOrThrow({
  //       where: {
  //         user_id: id,
  //       },
  //     })
  //     .patients({
  //       orderBy: {
  //         created_at: 'desc',
  //       },
  //       skip,
  //       take: pageSize,
  //       select: {
  //         emr: true,
  //         user: {
  //           select: {
  //             id: true,
  //             first_name: true,
  //             middle_name: true,
  //             last_name: true,
  //             email: true,
  //             uri: true,
  //             phone_number: true,
  //           },
  //         },
  //       },
  //     });

  //   // Get total count for pagination metadata
  //   const totalPatients = await this.prisma.doctor
  //     .findUniqueOrThrow({
  //       where: {
  //         user_id: id,
  //       },
  //     })
  //     .patients({
  //       select: {
  //         id: true,
  //       },
  //     });

  //   const total = totalPatients.length;
  //   const pageCount = Math.ceil(total / pageSize);

  //   console.log(pateintlist, 'pateintlist');

  //   // Return data with pagination metadata
  //   return {
  //     data: pateintlist,
  //     meta: {
  //       total,
  //       page,
  //       pageSize,
  //       pageCount,
  //     },
  //   };
  // }

  public async patientProfile(
    id: string,
    doctorId: string,
  ): Promise<PatientProfile> {
    const patient = await this.prisma.patient.findFirstOrThrow({
      where: {
        AND: [
          {
            user_id: id,
          },
          {
            doctors: {
              some: {
                user_id: doctorId,
              },
            },
          },
        ],
      },
      include: {
        user: {
          include: {
            location: {
              include: {
                city: {
                  include: {
                    country: true,
                  },
                },
              },
            },
            user_meta_data: true,
          },
        },
      },
    });

    this.helperService.deleteFields(patient, {
      user: {
        password: true,
        location_id: true,
        location: { city_id: true, city: { country_id: true } },
      },
      user_id: true,
    });

    return patient;
  }

  public async patientsContacts(
    id: string,
    doctorId: string,
    search: string,
  ): Promise<PatientContacts> {
    return await this.prisma.patient
      .findFirstOrThrow({
        where: {
          OR: [
            {
              AND: [
                {
                  user_id: id,
                },
                {
                  doctors: {
                    some: {
                      user_id: doctorId,
                    },
                  },
                },
              ],
            },
          ],
        },
      })
      .user()
      .contacts({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              email: search,
            },
          ],
        },
        select: {
          id: true,
          name: true,
          relationship: true,
          number: true,
          email: true,
          created_at: true,
        },
      });
  }

  public async createContact(
    id: string,
    data: ContactDTO,
  ): Promise<PatientContact> {
    const contact = await this.prisma.contacts.create({
      data: {
        ...data,
        user_id: id,
      },
    });

    this.helperService.deleteFields(contact, {
      user_id: true,
      updated_at: true,
    });

    return contact;
  }

  public async deleteContact(id: string, doctorId: string): Promise<JsonRes> {
    const contact = await this.prisma.contacts.findFirstOrThrow({
      where: {
        AND: [
          {
            user: {
              patient: {
                doctors: {
                  some: {
                    user_id: doctorId,
                  },
                },
              },
            },
          },
          {
            id,
          },
        ],
      },
    });

    await this.prisma.contacts.delete({
      where: {
        id: contact.id,
      },
    });

    return {
      status: 'success',
      message: 'Contact Deleted',
    };
  }
  public async getPatientsByDoctors(

    userId: string,

  ) {

    const doctor = await this.prisma.doctor.findFirst({
      where: {
        user: {
          id: userId,
        },
      },
    });

    if (doctor?.id === undefined) {
      throw new BadRequestException('Doctor not found');
    }
    return await this.prisma.patient.findMany({
      where: {
        doctors: {
          some: { id: doctor.id },
        },
      },
      select: {
        id: true,
        emr: true,
        weight: true,
        height: true,
        user: {
          select: {
            id: true,
            first_name: true,
            middle_name: true,
            last_name: true,
            dob: true,
            uri: true,
            role: true,
            gender: true,
            title: true,
            email: true,
            phone_number: true,
            username: true,
            created_at: true,
            updated_at: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });
  }
  public async getPatientDoctors(
    id: string,
    doctorId: string,
    search: string,
  ): Promise<PatientDoctors[]> {
    return await this.prisma.patient
      .findFirstOrThrow({
        where: {
          AND: [
            {
              doctors: {
                some: {
                  user_id: doctorId,
                },
              },
            },
            {
              user_id: id,
            },
          ],
        },
      })
      .doctors({
        where: {
          user: {
            OR: [
              {
                last_name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                first_name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: search,
              },
              {
                username: search,
              },
            ],
          },
        },
        select: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              middle_name: true,
              email: true,
              phone_number: true,
            },
          },
          specialities: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
            select: {
              title: true,
            },
          },
          departments: {
            orderBy: {
              created_at: 'desc',
            },
            select: {
              title: true,
            },
            take: 1,
          },
        },
      });
  }

  public async getPatientsNurses(
    id: string,
    doctorId: string,
    search: string,
  ): Promise<PatientNurses[]> {
    return await this.prisma.patient
      .findFirstOrThrow({
        where: {
          AND: [
            {
              doctors: {
                some: {
                  user_id: doctorId,
                },
              },
            },
            {
              user_id: id,
            },
          ],
        },
      })
      .nurses({
        where: {
          user: {
            OR: [
              {
                last_name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                first_name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: search,
              },
              {
                username: search,
              },
            ],
          },
        },
        select: {
          user: {
            select: {
              first_name: true,
              last_name: true,
              middle_name: true,
              email: true,
              phone_number: true,
            },
          },
          departments: {
            select: {
              title: true,
            },
          },
        },
      });
  }

  public async getNurses(search: string): Promise<GetNurses[]> {
    return await this.prisma.nurse.findMany({
      where: {
        OR: [
          {
            employee_id: search,
          },
          {
            npi_number: search,
          },
          {
            user: {
              first_name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            user: {
              last_name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      },

      select: {
        user: {
          select: {
            first_name: true,
            middle_name: true,
            last_name: true,
            email: true,
            id: true,
          },
        },
      },
    });
  }

  public async addPatientNurse(

    nurseId: string,
    patientId: string,

  ): Promise<GetNurses> {
    const isExisted = await this.prisma.nurse.findFirst({
      where: {
        AND: [
          {
            user_id: nurseId,
          },
          {
            patients: {
              some: {
                user_id: patientId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (isExisted?.id) {
      throw new AppError(
        'The nurse is already associated with this nurse',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.prisma.nurse.update({
      where: {
        user_id: nurseId,
      },
      data: {
        patients: {
          connect: {
            user_id: patientId,
          },
        },
      },

      select: {
        user: {
          select: {
            first_name: true,
            middle_name: true,
            last_name: true,
            email: true,
            id: true,
            phone_number: true,
          },
        },
        departments: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  public async addDoctor(
    data: AddDoctoreDTO,
    organizationId: string,
    locationId: string,
  ): Promise<boolean> {
    const password = await argon.hash(data.password);
    await this.prisma.user.create({
      data: {
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        email: data.email,
        dob: data.dob,
        role: 'DOCTOR',
        gender: data.gender,
        title: data.title,
        phone_number: data.phone_number,
        username: data.username,
        password: password,
        location_id: locationId,
        organization_id: organizationId,
        associated_branches: {
          connect: {
            id: data.branch_id,
          },
        },
        doctor: {
          create: {
            npi_number: data.npi_number,
            pmdc_number: data.pmdc_number,
            employee_id: data.employee_id,
            departments: {
              connect: {
                id: data.department_id,
              },
            },
          },
        },
      },
    });

    return true;
  }

  public async getOrganizationMedication(
    id: string,
    search: string,
  ): Promise<OrganizationMedication[]> {
    return this.prisma.user
      .findFirst({
        where: {
          id: id,
        },
      })
      .organization()
      .organization_medication({
        where: {
          OR: [
            {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        },
        select: {
          id: true,
          name: true,
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          created_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
        take: 10,
      });
  }


  // public async getStats(userId: string): Promise<{
  //   today: Record<string, number>;
  //   tomorrow: Record<string, number>;
  // }> {
  //   const now = new Date();
  //   const todayStart = new Date(now.setHours(0, 0, 0, 0));
  //   const todayEnd = new Date(now.setHours(23, 59, 59, 999));

  //   const tomorrowStart = new Date(todayStart);
  //   tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  //   const tomorrowEnd = new Date(todayEnd);
  //   tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  //   // Helper to get grouped counts for a given range
  //   const getCounts = async (start: Date, end: Date) => {
  //     const grouped = await this.prisma.appointment.groupBy({
  //       by: ['status'],
  //       where: {
  //         OR: [
  //           { organizer: { id: userId } },
  //           { participants: { some: { user_id: userId } } },
  //         ],
  //         AND: {
  //           start_date: { gte: start },
  //           end_date: { lte: end },
  //         },
  //       },
  //       _count: { status: true },
  //     });

  //     const counts = {
  //       hold: 0,
  //       cancelled: 0,
  //       ongoing: 0,
  //       active: 0,
  //       completed: 0,
  //       pending: 0,
  //     };

  //     grouped.forEach((item) => {
  //       const status = item.status.toLowerCase();
  //       if (counts[status] !== undefined) counts[status] = item._count.status;
  //     });

  //     return counts;
  //   };

  //   const [today, tomorrow] = await Promise.all([
  //     getCounts(todayStart, todayEnd),
  //     getCounts(tomorrowStart, tomorrowEnd),
  //   ]);

  //   return { today, tomorrow };
  // }
  public async getStats(userId: string): Promise<DoctorStats> {
    console.log(userId, '=======>>userId');
    const todayAppointments = await this.prisma.appointment.groupBy({
      by: ['status'],
      where: {
        OR: [
          {
            organizer: {
              id: userId,
            },
          },
          {
            participants: {
              some: {
                user_id: userId,
              },
            },
          },
        ],
        AND: {
          start_date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
          end_date: {
            lte: new Date(new Date().setHours(23, 59, 59, 999)),
          },
        },
      },
      _count: {
        status: true,
      },
    });

    const statusCounts = {
      hold: 0,
      cancelled: 0,
      ongoing: 0,
      active: 0,
      completed: 0,
      pending: 0,
    };

    todayAppointments.forEach((item) => {
      const status = item.status.toLowerCase();
      statusCounts[status] = item._count.status;
    });

    return statusCounts;
  }

  public async getDoctorList(search: string) {
    const doctorList = await this.prisma.doctor.findMany({
      where: {
        OR: [
          {
            user: {
              first_name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            user: {
              last_name: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
          {
            user: {
              email: {
                contains: search,
                mode: 'insensitive',
              },
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            middle_name: true,
            email: true,
            uri: true,
            phone_number: true,
          },
        },
        specialities: {
          select: {
            title: true,
          },
        },
        departments: {
          select: {
            title: true,
          },
        },
      },
    });

    console.log('doctorList>>>>>>>>>>>>> ', doctorList);

    return doctorList;
  }

  public async assignDoctorToPatient(doctorId: string, patientId: string) {
    const isExisted = await this.prisma.patient.findFirst({
      where: {
        AND: [
          { user_id: patientId },
          { doctors: { some: { user_id: doctorId } } },
        ],
      },
      select: {
        id: true,
      },
    });

    if (isExisted?.id) {
      throw new BadRequestException('The doctor is already associated with this patient');
    }

    const data = await this.prisma.patient.update({
      where: {
        user_id: patientId,
      },
      data: {
        doctors: {
          connect: {
            user_id: doctorId,
          },
        },
      },
    });

    return await this.prisma.doctor.findFirst({
      where: {
        user_id: doctorId,
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            middle_name: true,
            email: true,
            uri: true,
            phone_number: true,
          },
        },
        specialities: {
          select: {
            title: true,
          },
        },
        departments: {
          select: {
            title: true,
          },
        },
      },
    });
  }

  public async getSpecialityList() {
    const departmentList = await this.prisma.department.findMany({
      select: {
        id: true,
        title: true,
      },
    });

    return departmentList;
  }

  public async getDoctorsBySpeciality(specialityId: string) {
    const doctorList = await this.prisma.doctor.findMany({
      where: {
        departments: {
          some: {
            id: specialityId, // assuming `id` is the field name in `Speciality` model
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            middle_name: true,
            email: true,
            uri: true,
            phone_number: true,
          },
        },
        specialities: {
          select: {
            id: true,
            title: true,
          },
        },
        departments: {
          select: {
            title: true,
          },
        },
      },
    });



    return doctorList;
  }


  public async getNursesBySpeciality(specialityId: string) {
    const nurseList = await this.prisma.nurse.findMany({
      where: {
        departments: {
          some: {
            id: specialityId, /// assuming `id` is the field name in `Speciality` model
          },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            middle_name: true,
            email: true,
            uri: true,
            phone_number: true,
          },
        },
        specialities: {
          select: {
            id: true,
            title: true,
          },
        }
      },
    });
    return nurseList;
  }

}
