import { Injectable } from '@nestjs/common';
import { DoctorProfileUpdateDto } from 'src/doctor/dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddOrganizationDTO } from './dto/addOrganization.dto';
import { ToggleEmailTemplate } from './dto/toggleEmailTemplate.dto';

@Injectable()
export class MasterService {
  constructor(private readonly prisma: PrismaService) {}

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
        uri: data.uri,
        location: {
          update: {
            address: data.address,
          },
        },
      },
    });
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

  public async getOrganizations() {
    return await this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone_number: true,
        website: true,
        uri: true,
        location: {
          select: {
            address: true,
            city: {
              select: {
                name: true,
                country: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        created_at: true,
      },
    });
  }

  public async getStatistics() {
    const totalUsers = this.prisma.user.count();
    const totalOrganizations = this.prisma.organization.count();
    const totalBranches = this.prisma.branch.count();
    const totalEmails = this.prisma.emails.count();
    const totalDevices = this.prisma.device.count();
    const totalPatients = this.prisma.patient.count();
    const totalNurses = this.prisma.nurse.count();
    const totalDoctors = this.prisma.doctor.count();

    const [
      users,
      organizations,
      branches,
      emails,
      devices,
      patients,
      nurses,
      doctors,
    ] = await this.prisma.$transaction([
      totalUsers,
      totalOrganizations,
      totalBranches,
      totalEmails,
      totalDevices,
      totalPatients,
      totalNurses,
      totalDoctors,
    ]);

    return {
      users,
      organizations,
      branches,
      emails,
      devices,
      patients,
      nurses,
      doctors,
    };
  }

  public async getSelectOrganization() {
    return await this.prisma.organization.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  public async getCities() {
    return await this.prisma.city.findMany({
      select: {
        id: true,
        name: true,
      },
    });
  }

  public async createOrganization(data: AddOrganizationDTO) {
    const location = await this.prisma.location.create({
      data: {
        address: data.address,
        city_id: data.city_id,
      },
    });

    return await this.prisma.organization.create({
      data: {
        location_id: location.id,
        name: data.name,
        email: data.email,
        phone_number: data.phone_number,
        website: data.website,
        uri: data.uri,
        userId: 'master',
      },
    });
  }

  public async getSuperadmins() {
    return await this.prisma.user.findMany({
      where: {
        role: 'SUPERADMIN',
      },

      select: {
        id: true,
        uri: true,
        first_name: true,
        last_name: true,
        middle_name: true,
        email: true,
        phone_number: true,
        username: true,
        organization: {
          select: {
            name: true,
          },
        },
        location: {
          select: {
            city: true,
          },
        },
        created_at: true,
      },
    });
  }

  public async getEmailTemplates() {
    return this.prisma.emailTemplate.findMany({
      select: {
        id: true,
        key: true,
        subject: true,
        html: true,
        created_at: true,
        active: true,
      },

      orderBy: {
        created_at: 'desc',
      },
    });
  }

  public async toggleEmailTemplate(data: ToggleEmailTemplate) {
    const template = await this.prisma.emailTemplate.findUnique({
      where: {
        id: data.id,
      },
      select: {
        active: true,
        key: true,
      },
    });

    await this.prisma.emailTemplate.updateMany({
      where: {
        key: template.key,
      },
      data: {
        active: false,
      },
    });

    return await this.prisma.emailTemplate.update({
      where: {
        id: data.id,
      },
      data: {
        active: !template.active,
      },
    });
  }
}
