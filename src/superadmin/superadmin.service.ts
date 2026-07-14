import { HttpStatus, Injectable } from '@nestjs/common';

import { AppError } from 'src/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import { StatsProps } from './types';
import { DoctorProfileUpdateDto } from 'src/doctor/dto';

@Injectable()
export class SuperadminService {
  constructor(private prisma: PrismaService) { }

  public async getStats(organizationId: string): Promise<StatsProps> {
    const doctors = this.prisma.user.count({
      where: {

        AND: [
          {
            organization_id: organizationId,
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
            organization_id: organizationId,
          },
          {
            role: 'PATIENT',
          },
        ],
      },
    });

    const nurses = this.prisma.user.count({
      where: {
        AND: [
          {
            organization_id: organizationId,
          },
          {
            role: 'NURSE',
          },
        ],
      },
    });






    const branches = this.prisma.branch.count({
      where: { organization_id: organizationId },
    });

    const appointments = this.prisma.appointment.count({
      where: {
        organizer: {
          organization_id: organizationId,
        },
      },
    });
    // const appointments = this.prisma.appointment.count({
    //   where: { organizer_id: organizationId },
    // });

    const medications = this.prisma.organizationMedication.count({
      where: { organization_id: organizationId },
    });

    const [
      doctorsRes,
      patientsRes,
      nursesRes,
      branchesRes,
      appointmentsRes,
      medicationsRes,
    ] = await this.prisma.$transaction([
      doctors,
      patients,
      nurses,
      branches,
      appointments,
      medications,
    ]);

    return {
      data: {
        doctors: doctorsRes ?? 0,
        patients: patientsRes ?? 0,
        nurses: nursesRes ?? 0,
        branches: branchesRes ?? 0,
        appointments: appointmentsRes ?? 0,
        medications: medicationsRes ?? 0,
      },
    };
  }

  public async getOrganizationId(userId: string): Promise<string> {
    return (await this.validateOrganization(userId)).organization_id;
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

  private async validateOrganization(userId: string): Promise<{
    organization_id: string;
  }> {
    const res = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organization_id: true },
    });

    if (!res?.organization_id)
      throw new AppError('No Organization Found', HttpStatus.BAD_REQUEST);

    return res;
  }
}
