import { HttpStatus, Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { PrismaService } from 'src/prisma/prisma.service';
import { EMR_DTO } from './dto/emr.dto';
import { AppError } from '../errors/index';

@Injectable()
export class ElectronicmedicalreportService {
  constructor(private prisma: PrismaService) { }

  public async create(data: EMR_DTO) {
    const patient = await this.prisma.patient.findFirstOrThrow({
      where: { user_id: data.patient_id },
      select: { id: true },
    });

    if (!patient) {
      throw new AppError('Patient not found', HttpStatus.NOT_FOUND);
    }

    const report = await this.prisma.electronicMedicalReport.create({
      data: {
        patient_id: patient.id,
        title: data.title,
        uri: data.uri,
        description: data.description,
        type: data.type,
      },
      include: {
        patient: {
          include: {
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

    return report;
  }

  public async getPatientRecords(patient_id: string, search: string = '', page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const patient = await this.prisma.patient.findFirstOrThrow({
      where: { user_id: patient_id },
      select: { id: true },
    });

    const [reports, totalItems] = await this.prisma.$transaction([
      this.prisma.electronicMedicalReport.findMany({
        where: {
          patient_id: patient.id,
          title: { contains: search, mode: 'insensitive' }
        },
        skip,
        take,
        orderBy: { created: 'desc' },
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
      this.prisma.electronicMedicalReport.count({
        where: {
          patient_id: patient.id,
          title: { contains: search, mode: 'insensitive' }
        }
      }),
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

  public async getAllPatientReports(branchId: string, userId: string, page: number, limit: number) {

    const skip = (page - 1) * limit;
    const whereCondition = {
      patient: {
        AND: [
          {
            // ✅ only patients assigned to this doctor
            doctors: {
              some: {
                user_id: userId, // pass the logged-in doctor's user_id here
              },
            },
          },
          {
            // ✅ only patients whose user is linked to the given branch
            user: {
              associated_branches: {
                some: {
                  id: branchId, // target branch ID
                },
              },
            },
          },
        ],
      },
    };
    const [reports, totalItems] = await this.prisma.$transaction([



      this.prisma.electronicMedicalReport.findMany({
        skip,
        take: limit,
        orderBy: {
          created: 'desc',
        },
        where: whereCondition,
        select: {
          id: true,
          title: true,
          uri: true,
          created: true,
          description: true,
          type: true,
          patient: {
            select: {
              id: true,
              user: {
                select: {
                  id: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                  uri: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.electronicMedicalReport.count({ where: whereCondition }),
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
