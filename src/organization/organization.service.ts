import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

import type {
  CurrentOrganization,
  OrganizationUsers,
  SelectOrganizationBranchesProps,
  SelectOrganizationDepartmentProps,
} from './types';
import AppError from '../errors/AppError';
import { SendMailPayload, UserRes, UserRole } from '@types';
import { allowedQueryRoles, SENDGRID_TEMPLATES } from 'src/constant';
import { Role } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SendgridService } from 'src/sendGrid/sendgrid.service';

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private readonly sendgridService: SendgridService
  ) { }

  public async getOrganization(userId: string): Promise<CurrentOrganization> {
    return await this.prisma.organization.findFirst({
      where: {
        user: {
          some: {
            id: userId,
          },
        },
      },
      select: {
        name: true,
        uri: true,
        phone_number: true,
        email: true,
        active: true,
      },
    });
  }

  public async getOrganizationPatients(userId: string) {
    const organization = await this.validateOrganization(userId);

    return this.prisma.patient.findMany({
      where: {
        user: {
          organization: {
            id: organization.organization_id,
          },
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

  public async getOrganizationPatientsForWeb(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const organization = await this.validateOrganization(userId);

    const [patients, totalItems] = await this.prisma.$transaction([
      this.prisma.patient.findMany({
        skip,
        take: limit,
        where: {
          user: {
            organization: {
              id: organization.organization_id,
            },
          },
        },
        select: {
          id: true,
          emr: true,
          weight: true,
          height: true,
          created_at: true,
          updated_at: true,
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
        },
        orderBy: {
          created_at: 'desc',
        },
      }),
      this.prisma.patient.count({
        where: {
          user: {
            organization: {
              id: organization.organization_id,
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const transformedPatients = patients.map((patient) => ({
      emr: patient.emr,
      weight: patient.weight,
      height: patient.height,
      created_at: patient.created_at,
      updated_at: patient.updated_at,
      patient: {
        ...patient.user,
      },
    }));

    return {
      data: transformedPatients,
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

  // 1 This method is changed due to the need to flatten user properties into a new "patient" object request by abdullah.  
  // 2 change abdullah old code without pagination
  // public async getOrganizationPatientsForWeb(userId: string) {
  //   const organization = await this.validateOrganization(userId);

  //   const patients = await this.prisma.patient.findMany({
  //     where: {
  //       user: {
  //         organization: {
  //           id: organization.organization_id,
  //         },
  //       },
  //     },
  //     select: {
  //       id: true,
  //       emr: true,
  //       weight: true,
  //       height: true,
  //       user: {
  //         select: {
  //           id: true,
  //           first_name: true,
  //           middle_name: true,
  //           last_name: true,
  //           dob: true,
  //           uri: true,
  //           role: true,
  //           gender: true,
  //           title: true,
  //           email: true,
  //           phone_number: true,
  //           username: true,
  //           created_at: true,
  //           updated_at: true,
  //         },
  //       },
  //       created_at: true,
  //       updated_at: true,
  //     },
  //   });

  //   // Flatten user properties into a new "patient" object
  //   return patients.map((patient) => ({

  //     emr: patient.emr,
  //     weight: patient.weight,
  //     height: patient.height,
  //     created_at: patient.created_at,
  //     updated_at: patient.updated_at,
  //     patient: {
  //       ...patient.user
  //     }

  //   }));
  // }

  private async getBranchUsers(
    user: UserRes,
    search: string,
    role: UserRole,
  ): Promise<OrganizationUsers[]> {
    const branch = await this.validateBranch(user.id);

    const filter: any = [
      {
        NOT: {
          role: 'SUPERADMIN',
        },
      },
      {
        associated_branches: {
          some: {
            id: branch.branch_id,
          },
        },
      },
      {
        NOT: { id: user.id },
      },
      {
        OR: [
          {
            first_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            last_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            middle_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              equals: search,
            },
          },
          {
            username: {
              equals: search,
            },
          },
          {
            phone_number: {
              equals: search,
            },
          },
        ],
      },
    ];

    if (role && allowedQueryRoles.includes(role.toUpperCase() as Role)) {
      filter.push({
        role: role.toUpperCase(),
      });
    }

    return this.prisma.user.findMany({
      where: {
        AND: filter,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        middle_name: true,
        email: true,
        phone_number: true,
        username: true,
        role: true,
        gender: true,
        associated_branches: {
          select: {
            name: true,
          },
        },
        active: true,
      },
    });
  }

  public async getOrganizationUsers(
    user: UserRes,
    search: string,
    role: UserRole,
  ): Promise<OrganizationUsers[]> {
    if (user.role === 'ADMIN') {
      return this.getBranchUsers(user, search, role);
    }

    const organization = await this.validateOrganization(user.id);

    const filter: any = [
      {
        organization_id: organization.organization_id,
      },
      {
        NOT: { id: user.id },
      },
      {
        OR: [
          {
            first_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            last_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            middle_name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            email: {
              equals: search,
            },
          },
          {
            username: {
              equals: search,
            },
          },
          {
            phone_number: {
              equals: search,
            },
          },
        ],
      },
    ];

    if (role && allowedQueryRoles.includes(role.toUpperCase() as Role)) {
      filter.push({
        role: role.toUpperCase(),
      });
    }

    return this.prisma.user.findMany({
      where: {
        AND: filter,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        middle_name: true,
        email: true,
        phone_number: true,
        username: true,
        role: true,
        gender: true,
        associated_branches: {
          select: {
            name: true,
          },
        },
        active: true,
      },
    });
  }

  public async getOrganizationBranches(
    user: UserRes,
  ): Promise<SelectOrganizationBranchesProps[]> {
    if (user.role === 'ADMIN') {
      const branch = await this.validateBranch(user.id);
      return [
        {
          name: branch.name,
          id: branch.branch_id,
        },
      ];
    }

    const organization = await this.validateOrganization(user.id);

    return this.prisma.branch.findMany({
      where: {
        organization_id: organization.organization_id,
      },
      select: {
        name: true,
        id: true,
      },
    });
  }

  public async getOrganizationId(userId: string): Promise<string> {
    return (await this.validateOrganization(userId)).organization_id;
  }

  public async getOrganizationDoctors(userId: string) {
    const orgnization = await this.validateOrganization(userId);

    return await this.prisma.user.findMany({
      where: {
        AND: [
          {
            role: 'DOCTOR',
          },
          {
            organization_id: orgnization.organization_id,
          },
        ],
      },

      select: {
        first_name: true,
        middle_name: true,
        last_name: true,
        doctor: {
          select: {
            employee_id: true,
          },
        },
        id: true,
      },
    });
  }

  public async getOrganizationNurses(userId: string) {
    const orgnization = await this.validateOrganization(userId);

    return await this.prisma.user.findMany({
      where: {
        AND: [
          {
            role: 'NURSE',
          },
          {
            organization_id: orgnization.organization_id,
          },
        ],
      },

      select: {
        first_name: true,
        middle_name: true,
        last_name: true,
        nurse: {
          select: {
            employee_id: true,
          },
        },
        id: true,
      },
    });
  }

  public async getOrganizationDepartments(
    branchId: string,
    userId: string,
  ): Promise<Array<SelectOrganizationDepartmentProps>> {
    await this.validateOrganization(userId);

    return await this.prisma.department.findMany({
      where: {
        barnch_id: branchId,
      },
      select: {
        title: true,
        id: true,
      },
    });
  }

  private async validateBranch(
    userId: string,
  ): Promise<{ branch_id: string; name: string }> {
    const res = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        associated_branches: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!res?.associated_branches?.length)
      throw new AppError('No Organization Found', HttpStatus.BAD_REQUEST);

    return {
      branch_id: res.associated_branches[0].id,
      name: res.associated_branches[0].name,
    };
  }

  private async validateOrganization(userId: string): Promise<{ organization_id: string; }> {
    const res = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organization_id: true },
    });

    if (!res?.organization_id) throw new AppError('No Organization Found', HttpStatus.BAD_REQUEST);

    return res;
  }

  public async disableUser(id: string) {
    const status = await this.prisma.user.findUniqueOrThrow({
      where: {
        id,
      },
      select: {
        active: true,
      },
    });

    return await this.prisma.user.update({
      where: {
        id,
      },
      data: {
        active: !status.active,
      },
    });
  }

  public async addOrganizationMedicines(
    organizationId: string,
    names: string[],
  ) {
    await this.prisma.organizationMedication.createMany({
      data: names.map((name) => ({
        name,
        organization_id: organizationId,
      })),
    });

    return 'Success';
  }

  public async addOrganizationMedicine(organizationId: string, name: string) {
    return await this.prisma.organizationMedication.create({
      data: {
        name,
        organization_id: organizationId,
      },
    });

  }

  public async getOrganizationMedicines(organizationId: string) {
    return await this.prisma.organizationMedication.findMany({
      where: {
        organization_id: organizationId,
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

  public async sendOnBoardEmail({
    email,
    first_name,
    middle_name,
    role,
    title,
    last_name,
    password
  }: {
    email: string;
    first_name: string;
    middle_name?: string;
    last_name: string;
    role: UserRole;
    title?: string;
    password: string;
  }) {
    const mailPayload = {
      to: email,
      data: {
        subject: 'Welcome to AViCA',
        patientName: `${first_name}, ${last_name}`,
        patientEmail: email,
        patientPassword: password,
      },
      templateId: SENDGRID_TEMPLATES.ONBOARDING,
    } satisfies SendMailPayload;

    await this.sendgridService.sendSgMail(mailPayload);
  }

  private getName(
    firstName: string,
    middleName: string,
    lastName: string,
    role: UserRole,
    title: string,
  ): string {
    let user = '';
    if (firstName) user = firstName;
    if (middleName) user = `${user} ${middleName}`;
    if (lastName) user = `${user} ${lastName}`;
    if (role === 'DOCTOR') user = `Dr. ${user}`;
    if (role !== 'DOCTOR') user = `${title}. ${user}`;

    return user;
  }

  public async updateOrganizationMedicine(medicineId: string, name: string) {
    const medicine = await this.prisma.organizationMedication.findUnique({
      where: { id: medicineId },
    });

    if (!medicine) throw new AppError('Medicine not found', HttpStatus.NOT_FOUND);

    return await this.prisma.organizationMedication.update({
      where: { id: medicineId },
      data: { name },
    });
  }
}
