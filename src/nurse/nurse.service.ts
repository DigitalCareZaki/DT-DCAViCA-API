/* eslint-disable @typescript-eslint/ban-ts-comment */
import { Injectable, HttpStatus } from '@nestjs/common';

import * as argon from 'argon2';

import { PrismaService } from 'src/prisma/prisma.service';
import { HelpersService } from 'src/helpers/helpers.service';

import { AppError } from 'src/errors';

import { ContactDTO } from 'src/common/dto';
import { AddNurseDTO } from 'src/organization/dto';
import { DoctorProfileUpdateDto } from 'src/doctor/dto/doctorProfileUpdate.dto';

import type {
  ProfileRes,
  CurrentRes,
  Patients,
  PatientProfile,
  PatientContacts,
  PatientContact,
  PatientDoctors,
  PatientNurses,
  NurseStats,
} from './types';
import type { JsonRes } from '@types';
import { GetNurses } from 'src/doctor/types';

@Injectable()
export class NurseService {
  constructor(
    private prisma: PrismaService,
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
        pincode: true,
        username: true,
        location: {
          include: {
            city: {
              include: {
                country: true,
              },
            },
          },
        },
        nurse: {
          include: {
            department: true,
          },
        },
        created_at: true,
        updated_at: true,
        active: true,
      },
    });
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
    return await this.prisma.nurse
      .findUniqueOrThrow({
        where: {
          user_id: id,
        },
      })
      .patients({
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
  }

  public async patientProfile(
    id: string,
    nurseId: string,
  ): Promise<PatientProfile> {
    const patient = await this.prisma.patient.findFirstOrThrow({
      where: {
        AND: [
          {
            user_id: id,
          },
          {
            nurses: {
              some: {
                user_id: nurseId,
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
    nurseId: string,
  ): Promise<PatientContacts> {
    return await this.prisma.patient.findFirstOrThrow({
      where: {
        AND: [
          {
            user_id: id,
          },
          {
            nurses: {
              some: {
                user_id: nurseId,
              },
            },
          },
        ],
      },
      select: {
        user: {
          select: {
            contacts: {
              select: {
                id: true,
                name: true,
                relationship: true,
                number: true,
                email: true,
                created_at: true,
              },
            },
          },
        },
      },
    });
  }

  public async createContact(
    id: string,
    nurseId: string,
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

  public async deleteContact(id: string, nurseId: string): Promise<JsonRes> {
    const contact = await this.prisma.contacts.findFirstOrThrow({
      where: {
        AND: [
          {
            user: {
              patient: {
                nurses: {
                  some: {
                    user_id: nurseId,
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

  public async getPatientDoctors(
    id: string,
    nurseId: string,
    search: string,
  ): Promise<PatientDoctors[]> {
    return await this.prisma.patient
      .findFirstOrThrow({
        where: {
          AND: [
            {
              nurses: {
                some: {
                  user_id: nurseId,
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
          },
          departments: {
            orderBy: {
              created_at: 'desc',
            },
            take: 1,
          },
        },
      });
  }

  public async getPatientsNurses(
    id: string,
    nurseId: string,
    search: string,
  ): Promise<PatientNurses[]> {
    return await this.prisma.patient
      .findFirstOrThrow({
        where: {
          AND: [
            {
              nurses: {
                some: {
                  user_id: nurseId,
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
          department: {
            select: {
              title: true,
            },
          },
        },
      });
  }

  public async getNurses(search: string): Promise<any> {
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
    });
  }

  public async addNurse(
    data: AddNurseDTO,
    organization_id: string,
    location_id: string,
  ): Promise<boolean> {
    const npiExists = await this.prisma.nurse.findFirst({
      where: {
        npi_number: data.npi_number,
      },
      select: {
        id: true,
      },
    });

    if (npiExists) {
      throw new AppError(
        'Nurse with same NPI number already exists',
        HttpStatus.FORBIDDEN,
      );
    }

    await this.prisma.user.create({
      data: {
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        email: data.email,
        dob: data.dob,
        role: 'NURSE',
        gender: data.gender,
        title: data.title,
        phone_number: data.phone_number,
        username: data.username,
        password: await argon.hash(data.password),
        location_id,
        organization_id,
        associated_branches: {
          connect: {
            id: data.branch_id,
          },
        },
        nurse: {
          create: {
            npi_number: data.npi_number,
            employee_id: data.employee_id,
            department: {
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

  public async updateProfile(
    id: string,
    data: DoctorProfileUpdateDto,
  ): Promise<any> {
    return await this.prisma.user.update({
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
  }

  public async getStats(userId: string): Promise<NurseStats> {
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

  public async getSpecialityList() {
    const specializationList = await this.prisma.specialization.findMany({
      select: {
        id: true,
        title: true,
      },
    });

    return specializationList;
  }

  public async getNursesBySpeciality(specialityId: string) {
    const nurseList = await this.prisma.nurse.findMany({
      where: {
        specialities: {
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
        }
      },
    });
    return nurseList;
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
        department: {
          select: {
            title: true,
          },
        },
      },
    });
  }

}
