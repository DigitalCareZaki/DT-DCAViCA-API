import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { PrismaService } from 'src/prisma/prisma.service';
import { EMRDto } from './dto/emr.dto';

@Injectable()
export class ElectronicmedicalreportService {
  constructor(private prisma: PrismaService) {}

  public async create(user: UserRes, data: EMRDto) {
    const patient = await this.prisma.patient.findFirstOrThrow({
      where: {
        user_id: user.id,
      },

      select: {
        id: true,
      },
    });

    await this.prisma.electronicMedicalReport.create({
      data: {
        patient_id: patient.id,
        title: data.title,
        uri: data.uri,
        family_history: data.family_history,
      },
    });
  }

  public async getPatientRecords(
    patient_id: string | undefined,
    user_id: string,
    search: string,
  ) {
    const patient = await this.prisma.patient.findFirstOrThrow({
      where: {
        user_id: patient_id ?? user_id,
      },
      select: {
        id: true,
      },
    });

    console.log('patientId: ', patient.id);

    return await this.prisma.electronicMedicalReport.findMany({
      where: {
        patient_id: patient.id,
        title: {
          contains: search,
          mode: 'insensitive',
        },
      },

      select: {
        title: true,
        uri: true,
        created: true,
        family_history: true,
        patient: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                middle_name: true,
                uri: true,
                id: true,
              },
            },
          },
        },
      },
    });
  }

  public async getAllPatientReports() {
    return await this.prisma.electronicMedicalReport.findMany({
      select: {
        title: true,
        uri: true,
        created: true,
        family_history: true,
        patient: {
          select: {
            user: {
              select: {
                first_name: true,
                last_name: true,
                middle_name: true,
                uri: true,
                id: true,
              },
            },
          },
        },
      },
    });
  }
}
