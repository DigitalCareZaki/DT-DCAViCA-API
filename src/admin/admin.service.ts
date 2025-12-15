import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import * as argon from 'argon2';
import { DoctorProfileUpdateDto } from 'src/doctor/dto';
import { HelpersService } from 'src/helpers/helpers.service';

import { AddAdminDTO } from 'src/organization/dto/addAdmin.dto';
import { AddSuperadminDTO } from 'src/organization/dto/addSuperadmin.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private helperService: HelpersService,
  ) { }

  public async addSuperAdmin(data: AddSuperadminDTO, locationId: string) {
    return await this.prisma.user.create({
      data: {
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        dob: data.dob,
        role: 'SUPERADMIN',
        gender: data.gender,
        title: data.title,
        email: data.email,
        phone_number: data.phone_number,
        username: data.username,
        password: await argon.hash(data.password),
        location_id: locationId,
        organization_id: data.organization_id,
      },
    });
  }

  public async addAdmin(
    data: AddAdminDTO,
    locationId: string,
    orgnaizationId: string,
  ): Promise<boolean> {
    await this.prisma.user.create({
      data: {
        first_name: data.first_name,
        middle_name: data.middle_name,
        last_name: data.last_name,
        dob: data.dob,
        role: 'ADMIN',
        gender: data.gender,
        title: data.title,
        email: data.email,
        phone_number: data.phone_number,
        username: data.username,
        password: await argon.hash(data.password),
        location_id: locationId,
        organization_id: orgnaizationId,
        associated_branches: {
          connect: {
            id: data.branch_id,
          },
        },
      },
    });

    return true;
  }

  public async getPatients(search: string, user: UserRes, page: number, limit: number) {
    const skip = (page - 1) * limit;
    console.log(search, 'search>>>>>>>>>>>>')
    const currentOrganization = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        organization_id: true,
        associated_branches: { select: { id: true } },
      },
    });

    const branchId = currentOrganization.associated_branches[0]?.id;
    if (!branchId) throw new Error('No branch is associated with this user');

    const whereCondition: any = {
      role: 'PATIENT',
      associated_branches: { some: { id: branchId } },
    };

    // ✅ apply search only if value exists
    if (search?.trim()) {
      whereCondition.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [patients, totalItems] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        skip,
        take: limit,
        where: whereCondition,
        select: {
          id: true,
          email: true,
          patient: {
            select: {
              emr: true,
              height: true,
              weight: true,
              doctors: {
                select: {
                  specialities: { select: { title: true } },
                  user: {
                    select: { id: true, first_name: true, last_name: true },
                  },
                  departments: {
                    select: { title: true },
                  },
                },
                orderBy: { created_at: 'asc' },
              },
            },
          },
          first_name: true,
          last_name: true,
          middle_name: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({
        where: {
          AND: [
            { role: 'PATIENT' },
            { associated_branches: { some: { id: branchId } } },
          ],
        },
      }),
    ]);

    const enrichedPatients = patients.map((p) => {
      const firstDoctor = p.patient?.doctors?.[0] || null;
      return {
        ...p,
        patient: {
          ...p.patient,
          first_assigned_doctor: firstDoctor,
          department: firstDoctor?.specialities?.[0] || null,
        },
      };
    });

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: enrichedPatients,
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



  // old code without pagination
  // public async getPatients(user: UserRes, page: number, limit: number) {
  //   const skip = (page - 1) * limit;

  //   const currentOrganization = await this.prisma.user.findUniqueOrThrow({
  //     where: {
  //       id: user.id,
  //     },
  //     select: {
  //       organization_id: true,
  //       associated_branches: {
  //         select: {
  //           id: true,
  //         },
  //       },
  //     },
  //   });

  //   if (!currentOrganization.associated_branches[0]?.id)
  //     throw new Error('No branch is associated with this user');

  //   const patients = await this.prisma.user.findMany({
  //     where: {
  //       AND: [
  //         {
  //           role: 'PATIENT',
  //         },
  //         {
  //           associated_branches: {
  //             some: {
  //               id: currentOrganization.associated_branches[0]?.id,
  //             },
  //           },
  //         },
  //       ],
  //     },
  //     select: {
  //       id: true,
  //       email: true,
  //       patient: {
  //         select: {
  //           emr: true,
  //           height: true,
  //           weight: true,
  //           doctors: {
  //             select: {
  //               specialities: {
  //                 select: {
  //                   title: true,
  //                 },
  //               },
  //               user: {
  //                 select: {
  //                   id: true,
  //                   first_name: true,
  //                   last_name: true,
  //                 },
  //               }
  //             },
  //             orderBy: {
  //               created_at: 'asc', // or any field that determines order
  //             },
  //             // Note: .take(1) is not allowed here for many-to-many relations
  //           },
  //         },
  //       },
  //       first_name: true,
  //       last_name: true,
  //       middle_name: true,
  //       created_at: true,
  //     },
  //     // select: {
  //     //   id: true,
  //     //   email: true,
  //     //   patient: {
  //     //     select: {
  //     //       emr: true,
  //     //       height: true,
  //     //       weight: true,
  //     //     },
  //     //   },
  //     //   first_name: true,
  //     //   last_name: true,
  //     //   middle_name: true,
  //     //   created_at: true,
  //     // },

  //     orderBy: {
  //       created_at: 'desc',
  //     },
  //   });



  //   console.log(patients, 'patients>>>>>>>>>>>>>>');
  //   const enrichedPatients = patients.map((p) => {
  //     const firstDoctor = p.patient?.doctors?.[0] || null;

  //     return {
  //       ...p,
  //       patient: {
  //         ...p.patient,
  //         first_assigned_doctor: firstDoctor,
  //         department: firstDoctor.specialities[0],
  //       },
  //     };
  //   });
  //   return enrichedPatients;
  // }

  public async getPatientProfile(id: string) {
    const patient = await this.prisma.patient.findFirstOrThrow({
      where: {
        AND: [
          {
            user_id: id,
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

  public async getBranchId(id: string) {
    try {
      return await this.prisma.branch.findFirstOrThrow({
        where: {
          users: {
            some: {
              id,
            },
          },
        },

        select: {
          id: true,
        },
      });
    } catch (error) {
      console.error('Error fetching branch ID:', error);
      throw new Error('Could not fetch branch ID');
    }

  }

  public async getStats(branchId: string) {
    const doctors = this.prisma.user.count({
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
    });

    const patients = this.prisma.user.count({
      where: {
        AND: [
          {
            role: 'PATIENT',
          },
          {
            associated_branches: {
              some: {
                id: branchId,
              },
            },
          },
        ],
      },
    });

    const nurses = this.prisma.user.count({
      where: {
        AND: [
          {
            role: 'NURSE',
          },
          {
            associated_branches: {
              some: {
                id: branchId,
              },
            },
          },
        ],
      },
    });

    const appointments = this.prisma.appointment.count({
      where: {
        organizer: {
          organization: {
            branches: {
              some: {
                id: branchId,
              },
            },
          },
        },
      },
    });

    const medications = this.prisma.medication.count({
      where: {
        patient: {
          user: {
            organization: {
              branches: {
                some: {
                  id: branchId,
                },
              },
            },
          },
        },
      },
    });

    const departments = this.prisma.department.count({
      where: {
        branch: {
          id: branchId,
        },
      },
    });

    const [
      doctorsRes,
      patientsRes,
      nursesRes,
      appointmentsRes,
      medicationsRes,
      departmentsRes,
    ] = await this.prisma.$transaction([
      doctors,
      patients,
      nurses,
      appointments,
      medications,
      departments,
    ]);

    console.log('departments:', departmentsRes);

    return {
      data: {
        doctors: doctorsRes ?? 0,
        patients: patientsRes ?? 0,
        nurses: nursesRes ?? 0,
        branches: 0,
        departments: departmentsRes ?? 0,
        appointments: appointmentsRes ?? 0,
        medications: medicationsRes ?? 0,
      },
    };
  }

  public async profile(id: string) {
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
        created_at: true,
        updated_at: true,
      },
    });
  }

  public async updateProfile(
    id: string,
    data: DoctorProfileUpdateDto,
  ): Promise<any> {
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
  }
}
