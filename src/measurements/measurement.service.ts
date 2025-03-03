import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from 'src/prisma/prisma.service';

import { MeasurementDTO } from './dto';

import type {
  MeasurementType,
  MeasurementMode,
  MeasurementUnit,
  MeasurementReadingSource,
} from '@prisma/client';
import type { UserRole } from '@types';
import type { ModifiedMeasurement } from './types';
import type { MeasurementCreatedEvent } from 'src/events/types';

@Injectable()
export class MeasurementService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  // public async updateMeasurementStatus(
  //   measurementId: string,
  //   new_status: number,
  //   updated_status_by: string,
  // ) {
  //   return await this.prisma.measurement.update({
  //     where: {
  //       id: measurementId,
  //     },
  //     data: {
  //       updated_status: new_status,
  //       updated_status_by: updated_status_by,
  //       updated_status_at: new Date(),
  //     },
  //   });
  // }

  public async getMeasurementsOfAllPatients(
    userId: string,
    role: UserRole,
    type: string,
  ): Promise<ModifiedMeasurement[]> {
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

    if (type) {
      // Doctor and Nurse
      // if (role === 'DOCTOR' || role === 'NURSE') {}
      return await this.prisma.measurement.findMany({
        where: {
          patient: {
            user_id: {
              in: patientIds,
            },
          },
          type: type as MeasurementType,
        },
        select: {
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
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    }

    // Doctor and Nurse
    // if (role === 'DOCTOR' || role === 'NURSE') {}
    return await this.prisma.measurement.findMany({
      where: {
        patient: {
          user_id: {
            in: patientIds,
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
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  public async patientMeasurements(
    patientId: string,
    userId: string,
    role: UserRole,
    type: string,
  ): Promise<ModifiedMeasurement[]> {
    if (type) {
      // Doctor and Nurse
      if (role === 'DOCTOR' || role === 'NURSE') {
        return await this.prisma.patient
          .findFirstOrThrow({
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
          })
          .measurements({
            where: {
              type: type as MeasurementType,
            },
            select: {
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
            },
            orderBy: {
              created_at: 'desc',
            },
          });
      } else {
        // Patient
        return await this.prisma.patient
          .findFirstOrThrow({
            where: {
              user_id: userId,
            },
          })
          .measurements({
            where: {
              type: type as MeasurementType,
            },
            select: {
              id: true,
              title: true,
              status: true,
              updated_status: true,
              mode: true,
              type: true,
              updated_status_at: true,
              updated_status_by: true,
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
            orderBy: {
              created_at: 'desc',
            },
          });
      }
    }

    // Doctor and Nurse
    if (role === 'DOCTOR' || role === 'NURSE') {
      return await this.prisma.patient
        .findFirstOrThrow({
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
        })
        .measurements({
          select: {
            id: true,
            title: true,
            status: true,
            mode: true,
            type: true,
            updated_status: true,
            updated_status_at: true,
            updated_status_by: true,
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
          orderBy: {
            created_at: 'desc',
          },
        });
    } else {
      // Patient
      return await this.prisma.patient
        .findFirstOrThrow({
          where: {
            user_id: userId,
          },
        })
        .measurements({
          select: {
            id: true,
            updated_status: true,
            title: true,
            status: true,
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
          },
          orderBy: {
            created_at: 'desc',
          },
        });
    }
  }

  public async createPatientMeasurement(
    patientId: string,
    userId: string,
    role: UserRole,
    data: MeasurementDTO,
  ): Promise<ModifiedMeasurement> {
    let measurement = null;

    // Doctor and Nurse
    if (role === 'DOCTOR' || 'Nurse') {
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

  public async getPatientListWithLatestReadings(
    userId: string,
    role: UserRole,
  ): Promise<any[]> {
    // First get all patients associated with this doctor/nurse
    const patients = await this.prisma.patient.findMany({
      where: {
        [role === 'DOCTOR' ? 'doctors' : 'nurses']: {
          some: {
            user_id: userId,
          },
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
    });

    const patientIds = patients.map((p) => p.user_id);

    // Get all measurements for these patients, ordered by creation date
    const allMeasurements = await this.prisma.measurement.findMany({
      where: {
        patient: {
          user_id: {
            in: patientIds,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
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

      // Initialize patient entry if it doesn't exist
      if (!patientMeasurements[patientId]) {
        patientMeasurements[patientId] = {
          measurements: {},
        };
      }

      // Only add if this type doesn't exist yet (since we ordered by date desc)
      if (!patientMeasurements[patientId].measurements[measurementType]) {
        patientMeasurements[patientId].measurements[measurementType] =
          measurement;
      }
    }

    // Format the response
    const result = patients.map((patient) => {
      console.log(JSON.stringify(patient), 'patient===========>');
      return {
        patient: patient.user,
        measurements: patientMeasurements[patient.id]?.measurements || {},
      };
    });

    return result;
  }
}
