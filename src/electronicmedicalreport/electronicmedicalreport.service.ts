import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { PrismaService } from 'src/prisma/prisma.service';
import { EMRDto } from './dto/emr.dto';

@Injectable()
export class ElectronicmedicalreportService {
  constructor(private prisma: PrismaService) { }

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
        description: data.description,
        type: data.type,
      },
    });
  }

  public async getPatientRecords(patient_id: string, search: string) {
    const patient = await this.prisma.patient.findFirstOrThrow({
      where: {
        user_id: patient_id,
        // user_id: "0f73dccd-6794-4f83-bcd9-174bbd0b4110"
      },
      select: {
        id: true,
      },
    });

    console.log('patientId: >>>>>>>>>>>>>>  ', patient.id);

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
        description: true,
        type: true,
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

  public async getAllPatientReports(page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reports, totalItems] = await this.prisma.$transaction([
      this.prisma.electronicMedicalReport.findMany({
        skip,
        take: limit,
        orderBy: {
          created: 'desc',
        },
        select: {
          title: true,
          uri: true,
          created: true,
          description: true,
          type: true,
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
      }),
      this.prisma.electronicMedicalReport.count(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: reports,
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


  // before pagination old code
  // public async getAllPatientReports() {
  //   return await this.prisma.electronicMedicalReport.findMany({
  //     select: {
  //       title: true,
  //       uri: true,
  //       created: true,
  //       family_history: true,
  //       patient: {
  //         select: {
  //           user: {
  //             select: {
  //               first_name: true,
  //               last_name: true,
  //               middle_name: true,
  //               uri: true,
  //               id: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  // }
}
