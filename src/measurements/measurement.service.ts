import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from 'src/prisma/prisma.service';

import { MeasurementDTO, MultiValueMeasurementDTO, SingleValueMeasurementDTO } from './dto';

import type {
  MeasurementType,
  MeasurementMode,
  MeasurementUnit,
  MeasurementReadingSource,
} from '@prisma/client';
import type { PaginatedResult, UserRole } from '@types';
import type { ModifiedMeasurement } from './types';
import type { MeasurementCreatedEvent } from 'src/events/types';

@Injectable()
export class MeasurementService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) { }

  public async updateMeasurementStatus(
    measurementId: string,
    new_status: number,
    updated_by: string,
  ) {
    return await this.prisma.measurement.update({
      where: {
        id: measurementId,
      },
      data: {
        updated_status: new_status,
        updated_status_by: updated_by,
        updated_status_at: new Date(),
      },
    });
  }

  // this is the new one for pagination implementation
  public async getMeasurementsOfAllPatients(userId: string, role: UserRole, type: string, page: number, limit: number): Promise<PaginatedResult<ModifiedMeasurement>> {
    // Calculate pagination parameters
    const skip = (page - 1) * limit;


    // console.log(type, '=========>type')
    const patients = await this.prisma.patient.findMany({
      where: {
        [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
          some: {
            user_id: userId,
          },
        },
      },
      select: {
        user_id: true,
      },
    });

    const patientIds = patients.map((p) => p.user_id);

    // Common select object
    const selectObject = {
      id: true,
      title: true,
      status: true,
      mode: true,
      type: true,
      values: true,
      updated_status_at: true,
      updated_status_by: true,
      unit: true,
      reading_source: true,
      created_at: true,
      updated_status: true,
      patient: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              middle_name: true,
              last_name: true,
            },
          },
        },
      },
      doctor: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              middle_name: true,
              last_name: true,
            },
          },
        },
      },
      nurse: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              middle_name: true,
              last_name: true,
            },
          },
        },
      },
    };

    // Query conditions
    const whereCondition = {
      patient: {
        user_id: {
          in: patientIds,
        },
      },
      ...(type && { type: type as MeasurementType }),
    };

    // Fetch paginated measurements
    const measurements = await this.prisma.measurement.findMany({
      where: whereCondition,
      select: selectObject,
      orderBy: {
        created_at: 'desc',
      },
      skip,
      take: limit,
    });

    // Get total count for pagination
    const totalItems = await this.prisma.measurement.count({
      where: whereCondition,
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const prevPage = hasPrevPage ? page - 1 : null;

    return {
      data: measurements,
      pagination: {
        totalItems,
        perPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
      },
    };
  }


  // old one comment from abdullah and new one for pagination 
  // public async getMeasurementsOfAllPatients(
  //   userId: string,
  //   role: UserRole,
  //   type: string,
  // ): Promise<ModifiedMeasurement[]> {
  //   const patients = await this.prisma.patient.findMany({
  //     where: {
  //       [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
  //         some: {
  //           user_id: userId,
  //         },
  //       },
  //     },
  //     select: {
  //       user_id: true,
  //     },
  //   });
  //   const patientIds = patients.map((p) => p.user_id);

  //   if (type) {
  //     // Doctor and Nurse
  //     // if (role === 'DOCTOR' || role === 'NURSE') {}
  //     return await this.prisma.measurement.findMany({
  //       where: {
  //         patient: {
  //           user_id: {
  //             in: patientIds,
  //           },
  //         },
  //         type: type as MeasurementType,
  //       },
  //       select: {
  //         id: true,
  //         title: true,
  //         status: true,
  //         mode: true,
  //         type: true,
  //         values: true,
  //         updated_status_at: true,
  //         updated_status_by: true,
  //         unit: true,
  //         reading_source: true,
  //         created_at: true,
  //         updated_status: true,
  //         patient: {
  //           select: {
  //             user: {
  //               select: {
  //                 id: true,
  //                 email: true,
  //                 first_name: true,
  //                 middle_name: true,
  //                 last_name: true,
  //               },
  //             },
  //           },
  //         },
  //         doctor: {
  //           select: {
  //             user: {
  //               select: {
  //                 id: true,
  //                 email: true,
  //                 first_name: true,
  //                 middle_name: true,
  //                 last_name: true,
  //               },
  //             },
  //           },
  //         },
  //         nurse: {
  //           select: {
  //             user: {
  //               select: {
  //                 id: true,
  //                 email: true,
  //                 first_name: true,
  //                 middle_name: true,
  //                 last_name: true,
  //               },
  //             },
  //           },
  //         },
  //       },
  //       orderBy: {
  //         created_at: 'desc',
  //       },
  //     });
  //   }

  //   // Doctor and Nurse
  //   // if (role === 'DOCTOR' || role === 'NURSE') {}
  //   return await this.prisma.measurement.findMany({
  //     where: {
  //       patient: {
  //         user_id: {
  //           in: patientIds,
  //         },
  //       },
  //     },
  //     select: {
  //       id: true,
  //       title: true,
  //       status: true,
  //       mode: true,
  //       type: true,
  //       values: true,
  //       updated_status_at: true,
  //       updated_status_by: true,
  //       unit: true,
  //       reading_source: true,
  //       created_at: true,
  //       updated_status: true,
  //       patient: {
  //         select: {
  //           user: {
  //             select: {
  //               id: true,
  //               email: true,
  //               first_name: true,
  //               middle_name: true,
  //               last_name: true,
  //             },
  //           },
  //         },
  //       },
  //       doctor: {
  //         select: {
  //           user: {
  //             select: {
  //               id: true,
  //               email: true,
  //               first_name: true,
  //               middle_name: true,
  //               last_name: true,
  //             },
  //           },
  //         },
  //       },
  //       nurse: {
  //         select: {
  //           user: {
  //             select: {
  //               id: true,
  //               email: true,
  //               first_name: true,
  //               middle_name: true,
  //               last_name: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //     orderBy: {
  //       created_at: 'desc',
  //     },
  //   });
  // }

  // public async patientMeasurements(
  //   patientId: string,
  //   userId: string,
  //   role: UserRole,
  //   type: string,
  // ): Promise<ModifiedMeasurement[]> {
  //   if (type) {
  //     // Doctor and Nurse
  //     if (role === 'DOCTOR' || role === 'NURSE') {
  //       return await this.prisma.patient
  //         .findFirstOrThrow({
  //           where: {
  //             AND: [
  //               {
  //                 OR: [
  //                   {
  //                     doctors: {
  //                       some: {
  //                         user_id: userId,
  //                       },
  //                     },
  //                   },
  //                   {
  //                     nurses: {
  //                       some: {
  //                         user_id: userId,
  //                       },
  //                     },
  //                   },
  //                 ],
  //               },
  //               {
  //                 user_id: patientId,
  //               },
  //             ],
  //           },
  //         })
  //         .measurements({
  //           where: {
  //             type: type as MeasurementType,
  //           },
  //           select: {
  //             id: true,
  //             title: true,
  //             status: true,
  //             updated_status: true,
  //             mode: true,
  //             updated_status_at: true,
  //             updated_status_by: true,
  //             type: true,
  //             values: true,
  //             unit: true,
  //             reading_source: true,
  //             created_at: true,
  //             patient: {
  //               select: {
  //                 user: {
  //                   select: {
  //                     id: true,
  //                     email: true,
  //                     first_name: true,
  //                     middle_name: true,
  //                     last_name: true,
  //                   },
  //                 },
  //               },
  //             },
  //             doctor: {
  //               select: {
  //                 user: {
  //                   select: {
  //                     id: true,
  //                     email: true,
  //                     first_name: true,
  //                     middle_name: true,
  //                     last_name: true,
  //                   },
  //                 },
  //               },
  //             },
  //             nurse: {
  //               select: {
  //                 user: {
  //                   select: {
  //                     id: true,
  //                     email: true,
  //                     first_name: true,
  //                     middle_name: true,
  //                     last_name: true,
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //           orderBy: {
  //             created_at: 'desc',
  //           },
  //         });
  //     } else {
  //       // Patient
  //       return await this.prisma.patient
  //         .findFirstOrThrow({
  //           where: {
  //             user_id: userId,
  //           },
  //         })
  //         .measurements({
  //           where: {
  //             type: type as MeasurementType,
  //           },
  //           select: {
  //             id: true,
  //             title: true,
  //             status: true,
  //             updated_status: true,
  //             mode: true,
  //             type: true,
  //             updated_status_at: true,
  //             updated_status_by: true,
  //             values: true,
  //             unit: true,
  //             reading_source: true,
  //             created_at: true,
  //             patient: {
  //               select: {
  //                 user: {
  //                   select: {
  //                     id: true,
  //                     email: true,
  //                     first_name: true,
  //                     middle_name: true,
  //                     last_name: true,
  //                   },
  //                 },
  //               },
  //             },
  //             doctor: {
  //               select: {
  //                 user: {
  //                   select: {
  //                     id: true,
  //                     email: true,
  //                     first_name: true,
  //                     middle_name: true,
  //                     last_name: true,
  //                   },
  //                 },
  //               },
  //             },
  //             nurse: {
  //               select: {
  //                 user: {
  //                   select: {
  //                     id: true,
  //                     email: true,
  //                     first_name: true,
  //                     middle_name: true,
  //                     last_name: true,
  //                   },
  //                 },
  //               },
  //             },
  //           },
  //           orderBy: {
  //             created_at: 'desc',
  //           },
  //         });
  //     }
  //   }

  //   // Doctor and Nurse
  //   if (role === 'DOCTOR' || role === 'NURSE') {
  //     return await this.prisma.patient
  //       .findFirstOrThrow({
  //         where: {
  //           AND: [
  //             {
  //               OR: [
  //                 {
  //                   doctors: {
  //                     some: {
  //                       user_id: userId,
  //                     },
  //                   },
  //                 },
  //                 {
  //                   nurses: {
  //                     some: {
  //                       user_id: userId,
  //                     },
  //                   },
  //                 },
  //               ],
  //             },
  //             {
  //               user_id: patientId,
  //             },
  //           ],
  //         },
  //       })
  //       .measurements({
  //         select: {
  //           id: true,
  //           title: true,
  //           status: true,
  //           mode: true,
  //           type: true,
  //           updated_status: true,
  //           updated_status_at: true,
  //           updated_status_by: true,
  //           values: true,
  //           unit: true,
  //           reading_source: true,
  //           created_at: true,
  //           patient: {
  //             select: {
  //               user: {
  //                 select: {
  //                   id: true,
  //                   email: true,
  //                   first_name: true,
  //                   middle_name: true,
  //                   last_name: true,
  //                 },
  //               },
  //             },
  //           },
  //           doctor: {
  //             select: {
  //               user: {
  //                 select: {
  //                   id: true,
  //                   email: true,
  //                   first_name: true,
  //                   middle_name: true,
  //                   last_name: true,
  //                 },
  //               },
  //             },
  //           },
  //           nurse: {
  //             select: {
  //               user: {
  //                 select: {
  //                   id: true,
  //                   email: true,
  //                   first_name: true,
  //                   middle_name: true,
  //                   last_name: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //         orderBy: {
  //           created_at: 'desc',
  //         },
  //       });
  //   } else {
  //     // Patient
  //     return await this.prisma.patient
  //       .findFirstOrThrow({
  //         where: {
  //           user_id: userId,
  //         },
  //       })
  //       .measurements({
  //         select: {
  //           id: true,
  //           updated_status: true,
  //           title: true,
  //           status: true,
  //           mode: true,
  //           updated_status_at: true,
  //           updated_status_by: true,
  //           type: true,
  //           values: true,
  //           unit: true,
  //           reading_source: true,
  //           created_at: true,
  //           patient: {
  //             select: {
  //               user: {
  //                 select: {
  //                   id: true,
  //                   email: true,
  //                   first_name: true,
  //                   middle_name: true,
  //                   last_name: true,
  //                 },
  //               },
  //             },
  //           },
  //           doctor: {
  //             select: {
  //               user: {
  //                 select: {
  //                   id: true,
  //                   email: true,
  //                   first_name: true,
  //                   middle_name: true,
  //                   last_name: true,
  //                 },
  //               },
  //             },
  //           },
  //           nurse: {
  //             select: {
  //               user: {
  //                 select: {
  //                   id: true,
  //                   email: true,
  //                   first_name: true,
  //                   middle_name: true,
  //                   last_name: true,
  //                 },
  //               },
  //             },
  //           },
  //         },
  //         orderBy: {
  //           created_at: 'desc',
  //         },
  //       });
  //   }
  // }

  public async createPatientMeasurement(patientId: string, userId: string, role: UserRole, data: MeasurementDTO) {
    let measurement = null;

    // Doctor and Nurse
    if (role === 'DOCTOR' || role === 'NURSE') {
      measurement = await this.prisma.measurement.create({
        data: {
          title: data.title,
          mode: data.mode as MeasurementMode,
          type: data.type as MeasurementType,
          unit: data.unit as MeasurementUnit,
          reading_source: data.reading_source as MeasurementReadingSource,
          values: data.values,
          [role.toLocaleLowerCase()]: {
            connect: {
              user_id: userId,
            },
          },
          patient: {
            connect: {
              user_id: patientId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          mode: true,
          type: true,
          values: true,
          unit: true,
          reading_source: true,
          created_at: true,
          patient: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          doctor: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          nurse: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      });
    } else {
      // Patient
      measurement = await this.prisma.measurement.create({
        data: {
          title: data.title,
          mode: data.mode as MeasurementMode,
          type: data.type as MeasurementType,
          unit: data.unit as MeasurementUnit,
          reading_source: data.reading_source as MeasurementReadingSource,
          values: data.values,
          patient: {
            connect: {
              user_id: userId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          mode: true,
          type: true,
          values: true,
          unit: true,
          reading_source: true,
          created_at: true,
          patient: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          doctor: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          nurse: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      });
    }

    process.nextTick(() => {
      const payload: MeasurementCreatedEvent = {
        patientId,
        measurement,
      };
      this.eventEmitter.emitAsync('measurement.created', payload);
    });

    return measurement;
  }

  public async addSingleValueMeasurement(patientId: string, userId: string, role: UserRole, data: SingleValueMeasurementDTO) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    console.log('object', user, '=========>user');

    // if (!user) throw new AppError('User not found', 404);

    let measurement = null;

    // Doctor and Nurse
    if (role === 'DOCTOR' || role === 'NURSE') {
      measurement = await this.prisma.measurement.create({
        data: {
          title: data.title,
          mode: data.mode as MeasurementMode,
          type: data.type as MeasurementType,
          unit: data.unit as MeasurementUnit,
          reading_source: data.reading_source as MeasurementReadingSource,
          values: [data.value],
          [role.toLocaleLowerCase()]: {
            connect: {
              user_id: userId,
            },
          },
          patient: {
            connect: {
              user_id: patientId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          mode: true,
          type: true,
          values: true,
          unit: true,
          reading_source: true,
          created_at: true,
          patient: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          doctor: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          nurse: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      });
    } else {
      // Patient
      measurement = await this.prisma.measurement.create({
        data: {
          title: data.title,
          mode: data.mode as MeasurementMode,
          type: data.type as MeasurementType,
          unit: data.unit as MeasurementUnit,
          reading_source: data.reading_source as MeasurementReadingSource,
          values: [data.value],
          patient: {
            connect: {
              user_id: userId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          mode: true,
          type: true,
          values: true,
          unit: true,
          reading_source: true,
          created_at: true,
          patient: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          doctor: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          nurse: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      });
    }

    console.log(measurement, '=========>measurement');

    process.nextTick(() => {
      const payload: MeasurementCreatedEvent = {
        patientId,
        measurement,
      };
      this.eventEmitter.emitAsync('measurement.created', payload);
    });

    return measurement;
  }

  public async addMultiValueMeasurement(patientId: string, userId: string, role: UserRole, data: MultiValueMeasurementDTO) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
      },
    });

    console.log('object', user, '=========>user');

    // if (!user) throw new AppError('User not found', 404);

    let measurement = null;

    // Doctor and Nurse
    if (role === 'DOCTOR' || role === 'NURSE') {
      measurement = await this.prisma.measurement.create({
        data: {
          title: data.title,
          mode: data.mode as MeasurementMode,
          type: data.type as MeasurementType,
          unit: data.unit as MeasurementUnit,
          reading_source: data.reading_source as MeasurementReadingSource,
          values: [data.value1, data.value2],
          [role.toLocaleLowerCase()]: {
            connect: {
              user_id: userId,
            },
          },
          patient: {
            connect: {
              user_id: patientId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          mode: true,
          type: true,
          values: true,
          unit: true,
          reading_source: true,
          created_at: true,
          patient: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          doctor: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          nurse: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      });
    } else {
      // Patient
      measurement = await this.prisma.measurement.create({
        data: {
          title: data.title,
          mode: data.mode as MeasurementMode,
          type: data.type as MeasurementType,
          unit: data.unit as MeasurementUnit,
          reading_source: data.reading_source as MeasurementReadingSource,
          values: [data.value1, data.value2],
          patient: {
            connect: {
              user_id: userId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          status: true,
          mode: true,
          type: true,
          values: true,
          unit: true,
          reading_source: true,
          created_at: true,
          patient: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          doctor: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
          nurse: {
            select: {
              user: {
                select: {
                  id: true,
                  email: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                },
              },
            },
          },
        },
      });
    }

    console.log(measurement, '=========>measurement');

    process.nextTick(() => {
      const payload: MeasurementCreatedEvent = {
        patientId,
        measurement,
      };
      this.eventEmitter.emitAsync('measurement.created', payload);
    });

    return measurement;
  }


  public async getPatientListWithLatestReadings(
    userId: string,
    role: UserRole,
    page: number,
    limit: number
  ): Promise<PaginatedResult<any>> {
    const skip = (page - 1) * limit;

    // Get paginated patients associated with this doctor/nurse
    const patients = await this.prisma.patient.findMany({
      where: {
        [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
          some: { user_id: userId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            middle_name: true,
            last_name: true,
          },
        },
      },
      skip,
      take: limit,
    });

    const totalPatients = await this.prisma.patient.count({
      where: {
        [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
          some: { user_id: userId },
        },
      },
    });

    const patientIds = patients.map((p) => p.user_id);

    // Get all measurements for these patients, ordered by creation date
    const allMeasurements = await this.prisma.measurement.findMany({
      where: {
        patient: {
          user_id: { in: patientIds },
        },
      },
      orderBy: { created_at: 'desc' },
      include: {
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                middle_name: true,
                last_name: true,
              },
            },
          },
        },
        nurse: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                first_name: true,
                middle_name: true,
                last_name: true,
              },
            },
          },
        },
      },
    });

    // Group measurements by patient and get latest of each type
    const patientMeasurements = {};

    for (const measurement of allMeasurements) {
      const patientId = measurement.patient_id;
      const measurementType = measurement.type;

      if (!patientMeasurements[patientId]) {
        patientMeasurements[patientId] = { measurements: {} };
      }

      if (!patientMeasurements[patientId].measurements[measurementType]) {
        patientMeasurements[patientId].measurements[measurementType] = measurement;
      }
    }

    const result = patients.map((patient) => ({
      patient: patient.user,
      measurements: patientMeasurements[patient.id]?.measurements || {},
    }));

    const totalPages = Math.ceil(totalPatients / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const prevPage = hasPrevPage ? page - 1 : null;

    return {
      data: result,
      pagination: {
        totalItems: totalPatients,
        perPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
      },
    };
  }


  // public async getPatientListWithLatestReadings(
  //   userId: string,
  //   role: UserRole,
  // ): Promise<any[]> {
  //   // First get all patients associated with this doctor/nurse
  //   const patients = await this.prisma.patient.findMany({
  //     where: {
  //       [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
  //         some: {
  //           user_id: userId,
  //         },
  //       },
  //     },
  //     include: {
  //       user: {
  //         select: {
  //           id: true,
  //           email: true,
  //           first_name: true,
  //           middle_name: true,
  //           last_name: true,
  //         },
  //       },
  //     },
  //   });

  //   const patientIds = patients.map((p) => p.user_id);

  //   // Get all measurements for these patients, ordered by creation date
  //   const allMeasurements = await this.prisma.measurement.findMany({
  //     where: {
  //       patient: {
  //         user_id: {
  //           in: patientIds,
  //         },
  //       },
  //     },
  //     orderBy: {
  //       created_at: 'desc',
  //     },
  //     include: {
  //       doctor: {
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               email: true,
  //               first_name: true,
  //               middle_name: true,
  //               last_name: true,
  //             },
  //           },
  //         },
  //       },
  //       nurse: {
  //         include: {
  //           user: {
  //             select: {
  //               id: true,
  //               email: true,
  //               first_name: true,
  //               middle_name: true,
  //               last_name: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   // Group measurements by patient and get latest of each type
  //   const patientMeasurements = {};

  //   for (const measurement of allMeasurements) {
  //     const patientId = measurement.patient_id;
  //     const measurementType = measurement.type;

  //     // Initialize patient entry if it doesn't exist
  //     if (!patientMeasurements[patientId]) {
  //       patientMeasurements[patientId] = {
  //         measurements: {},
  //       };
  //     }

  //     // Only add if this type doesn't exist yet (since we ordered by date desc)
  //     if (!patientMeasurements[patientId].measurements[measurementType]) {
  //       patientMeasurements[patientId].measurements[measurementType] =
  //         measurement;
  //     }
  //   }

  //   // Format the response
  //   const result = patients.map((patient) => {
  //     console.log(JSON.stringify(patient), 'patient===========>');
  //     return {
  //       patient: patient.user,
  //       measurements: patientMeasurements[patient.id]?.measurements || {},
  //     };
  //   });

  //   return result;
  // }

  public async patientMeasurements(
    patientId: string,
    userId: string,
    role: UserRole,
    type: string,
    page: number,
    limit: number,
  ): Promise<PaginatedResult<ModifiedMeasurement>> {
    // Calculate pagination parameters
    console.log(page, limit, '==========>  page');
    const skip = (page - 1) * limit;

    let measurements: ModifiedMeasurement[] = [];
    let totalItems = 0;

    // Common select object for measurements
    const selectObject = {
      id: true,
      title: true,
      status: true,
      updated_status: true,
      mode: true,
      updated_status_at: true,
      updated_status_by: true,
      type: true,
      values: true,
      unit: true,
      reading_source: true,
      created_at: true,
      patient: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              middle_name: true,
              last_name: true,
            },
          },
        },
      },
      doctor: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              middle_name: true,
              last_name: true,
            },
          },
        },
      },
      nurse: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              middle_name: true,
              last_name: true,
            },
          },
        },
      },
    };

    // Doctor and Nurse query conditions
    const doctorNurseCondition = {
      where: {
        AND: [
          {
            OR: [
              {
                doctors: {
                  some: {
                    user_id: userId,
                  },
                },
              },
              {
                nurses: {
                  some: {
                    user_id: userId,
                  },
                },
              },
            ],
          },
          {
            user_id: patientId,
          },
        ],
      },
    };

    // Patient condition
    const patientCondition = {
      where: {
        user_id: userId,
      },
    };

    if (type) {
      // Doctor and Nurse with specific measurement type
      if (role === 'DOCTOR' || role === 'NURSE') {
        // Get paginated data
        measurements = await this.prisma.patient
          .findFirstOrThrow(doctorNurseCondition)
          .measurements({
            where: {
              type: type as MeasurementType,
            },
            select: selectObject,
            orderBy: {
              created_at: 'desc',
            },
            skip,
            take: limit,
          });

        // Get total count for pagination metadata
        const countResult = await this.prisma.measurement.count({
          where: {
            AND: [
              { type: type as MeasurementType },
              {
                patient: {
                  ...doctorNurseCondition.where,
                },
              },
            ],
          },
        });
        totalItems = countResult;
      } else {
        // Patient with specific measurement type
        measurements = await this.prisma.patient
          .findFirstOrThrow(patientCondition)
          .measurements({
            where: {
              type: type as MeasurementType,
            },
            select: selectObject,
            orderBy: {
              created_at: 'desc',
            },
            skip,
            take: limit,
          });

        // Get total count
        const countResult = await this.prisma.measurement.count({
          where: {
            AND: [
              { type: type as MeasurementType },
              {
                patient: {
                  ...patientCondition.where,
                },
              },
            ],
          },
        });
        totalItems = countResult;
      }
    } else {
      // Doctor and Nurse without specific type
      if (role === 'DOCTOR' || role === 'NURSE') {
        measurements = await this.prisma.patient
          .findFirstOrThrow(doctorNurseCondition)
          .measurements({
            select: selectObject,
            orderBy: {
              created_at: 'desc',
            },
            skip,
            take: limit,
          });

        // Get total count
        const countResult = await this.prisma.measurement.count({
          where: {
            patient: {
              ...doctorNurseCondition.where,
            },
          },
        });
        totalItems = countResult;
      } else {
        // Patient without specific type
        measurements = await this.prisma.patient
          .findFirstOrThrow(patientCondition)
          .measurements({
            select: selectObject,
            orderBy: {
              created_at: 'desc',
            },
            skip,
            take: limit,
          });
        console.log(measurements, 'measurements=========>>>>>');
        // Get total count
        const countResult = await this.prisma.measurement.count({
          where: {
            patient: {
              ...patientCondition.where,
            },
          },
        });
        totalItems = countResult;
      }
    }

    // Calculate page count
    const totalPages = Math.ceil(totalItems / limit);

    // Calculate nextPage and prevPage
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    const nextPage = hasNextPage ? page + 1 : null;
    const prevPage = hasPrevPage ? page - 1 : null;

    // Return data with pagination metadata
    return {
      data: measurements,
      pagination: {
        totalItems,
        perPage: limit,
        currentPage: page,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage
      },
    };
  }
}
