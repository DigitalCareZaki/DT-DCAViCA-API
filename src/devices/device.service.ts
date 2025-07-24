import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { DeviceDTO, ManageDeviceDTO, PatientDeviceDTO } from './dto';

import type { MeasurementType } from '@prisma/client';
import type { UserRole } from '@types';
import type { Device } from './types';

@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService) { }

  public async getAllDevices(
    userId: string,
    organizationId: string,
    role: UserRole,
    search: string,
    page: number = 1,
    limit: number = 10
  ) {
    console.log('Fetching all devices with search:', search);
    if (role === 'SUPERADMIN') {
      const skip = (page - 1) * limit;
      const [devices, totalItems] = await this.prisma.$transaction([
        this.prisma.device.findMany({
          skip,
          take: limit,
          where: {
            created_by: {
              organization: {
                id: organizationId,
              },
            },
            OR: [
              {
                title: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          },

          select: {
            id: true,
            title: true,
            description: true,
            serial_number: true,
            uri: true,
            category: true,
            created_by: {
              select: {
                id: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                email: true,
              },
            },
            patient_devices: {
              select: {
                issued_to: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        first_name: true,
                        middle_name: true,
                        last_name: true,
                        email: true,
                      },
                    },
                  },
                },
                issued_by: {
                  select: {
                    id: true,
                    first_name: true,
                    middle_name: true,
                    last_name: true,
                    email: true,
                  },
                },
                issued_at: true,
              },
            },
            created_at: true,
            updated_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.device.count({
          where: {
            created_by: {
              organization: {
                id: organizationId,
              },
            },
            OR: [
              {
                title: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          },
        }),
      ]);
      const totalPages = Math.ceil(totalItems / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      return {
        data: devices,
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

    } else {
      // For ADMIN, DOCTOR and NURSE
      const res = await this.prisma.user.findUniqueOrThrow({

        where: { id: userId },
        select: {
          associated_branches: {
            select: {
              id: true,
            },
          },
          organization: {
            select: {
              id: true,
            },
          },
        },
      });
      const skip = (page - 1) * limit;
      const [devices, totalItems] = await this.prisma.$transaction([
        this.prisma.device.findMany({
          skip,
          take: limit,
          where: {
            AND: [
              {
                OR: [
                  {
                    created_by: {
                      associated_branches: {
                        some: {
                          id: res.associated_branches[0]?.id,
                        },
                      },
                    },
                  },
                  {
                    created_by: {
                      organization_id: res.organization.id,
                    },
                  },
                ],
              },
              {
                OR: [
                  {
                    title: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    description: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            ],
          },
          select: {
            id: true,
            title: true,
            description: true,
            serial_number: true,
            uri: true,
            category: true,
            created_by: {
              select: {
                id: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                email: true,
              },
            },
            patient_devices: {
              select: {
                issued_to: {
                  select: {
                    user: {
                      select: {
                        id: true,
                        first_name: true,
                        middle_name: true,
                        last_name: true,
                        email: true,
                      },
                    },
                  },
                },
                issued_by: {
                  select: {
                    id: true,
                    first_name: true,
                    middle_name: true,
                    last_name: true,
                    email: true,
                  },
                },
                issued_at: true,
              },
            },
            created_at: true,
            updated_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        }),
        this.prisma.device.count({
          where: {
            AND: [
              {
                OR: [
                  {
                    created_by: {
                      associated_branches: {
                        some: {
                          id: res.associated_branches[0]?.id,
                        },
                      },
                    },
                  },
                  {
                    created_by: {
                      organization_id: res.organization.id,
                    },
                  },
                ],
              },
              {
                OR: [
                  {
                    title: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                  {
                    description: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  },
                ],
              },
            ],
          },
        }),
      ]);

      const totalPages = Math.ceil(totalItems / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      const enrichedDevices = devices.map((device) => {
        const isAssigned = device.patient_devices && device.patient_devices.length > 0;
        return {
          ...device,
          assigned: isAssigned,
        };
      });

      return {
        data: enrichedDevices,
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


  }

  public async getSingleDevice(
    deviceId: string,
    userId: string,
    organizationId: string,
    role: UserRole,
  ) {
    if (role === 'SUPERADMIN') {
      return await this.prisma.device.findUniqueOrThrow({
        where: {
          id: deviceId,
          created_by: {
            organization: {
              id: organizationId,
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          serial_number: true,
          uri: true,
          category: true,
          created_by: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              email: true,
            },
          },
          patient_devices: {
            select: {
              issued_to: {
                select: {
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      middle_name: true,
                      last_name: true,
                      email: true,
                    },
                  },
                },
              },
              issued_by: {
                select: {
                  id: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                  email: true,
                },
              },
              issued_at: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
      });
    } else {
      // For ADMIN, DOCTOR and NURSE
      const res = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          associated_branches: {
            select: {
              id: true,
            },
          },
        },
      });

      return await this.prisma.device.findUniqueOrThrow({
        where: {
          id: deviceId,
          OR: [
            {
              created_by: {
                organization: {
                  id: organizationId,
                },
              },
            },
            {
              created_by: {
                associated_branches: {
                  some: {
                    id: res.associated_branches[0]?.id,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          description: true,
          serial_number: true,
          uri: true,
          category: true,
          created_by: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              email: true,
            },
          },
          patient_devices: {
            select: {
              issued_to: {
                select: {
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      middle_name: true,
                      last_name: true,
                      email: true,
                    },
                  },
                },
              },
              issued_by: {
                select: {
                  id: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                  email: true,
                },
              },
              issued_at: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
      });
    }
  }

  public async getDeviceList(
    category: MeasurementType,

  ) {

    return await this.prisma.device.findMany({
      where: {
        category: category,
        patient_devices: {
          none: {},
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        serial_number: true,
        uri: true,
        category: true,
        created_by: {
          select: {
            id: true,
            first_name: true,
            middle_name: true,
            last_name: true,
            email: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

  }

  public async getAllDevicesForPatient(
    patientId: string,
    userId: string,
    organizationId: string,
    role: UserRole,
  ) {
    const patient = await this.prisma.patient.findFirst({
      where: {
        AND: [
          {
            user: {
              id: patientId,
            },
          },
          {
            user: {
              organization: {
                id: organizationId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!patient) {
      throw new Error(
        'Either patient does not exist or is not in your organization',
      );
    }

    if (role === 'SUPERADMIN') {
      return await this.prisma.device.findMany({
        where: {
          patient_devices: {
            some: {
              issued_to: {
                user_id: patientId,
              },
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          serial_number: true,
          uri: true,
          category: true,
          created_by: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              email: true,
            },
          },
          patient_devices: {
            select: {
              issued_to: {
                select: {
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      middle_name: true,
                      last_name: true,
                      email: true,
                    },
                  },
                },
              },
              issued_by: {
                select: {
                  id: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                  email: true,
                },
              },
              issued_at: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    } else {
      // For ADMIN, DOCTOR and NURSE
      const res = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          associated_branches: {
            select: {
              id: true,
            },
          },
        },
      });

      return await this.prisma.device.findMany({
        where: {
          patient_devices: {
            some: {
              AND: [
                {
                  issued_to: {
                    user_id: patientId,
                  },
                },
                {
                  OR: [
                    {
                      issued_to: {
                        user: {
                          associated_branches: {
                            some: {
                              id: res.associated_branches[0]?.id,
                            },
                          },
                        },
                      },
                    },
                    {
                      issued_to: {
                        user: {
                          organization: {
                            id: organizationId,
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          serial_number: true,
          uri: true,
          category: true,
          created_by: {
            select: {
              id: true,
              first_name: true,
              middle_name: true,
              last_name: true,
              email: true,
            },
          },
          patient_devices: {
            select: {
              issued_to: {
                select: {
                  user: {
                    select: {
                      id: true,
                      first_name: true,
                      middle_name: true,
                      last_name: true,
                      email: true,
                    },
                  },
                },
              },
              issued_by: {
                select: {
                  id: true,
                  first_name: true,
                  middle_name: true,
                  last_name: true,
                  email: true,
                },
              },
              issued_at: true,
            },
          },
          created_at: true,
          updated_at: true,
        },
        orderBy: {
          created_at: 'desc',
        },
      });
    }
  }

  public async createDevice(userId, organizationId: string, data: DeviceDTO) {
    // check if device does not already exist in organization
    console.log(data, 'device data ===========>>>');
    const deviceAlreadyExists = await this.prisma.device.findFirst({
      where: {
        AND: [
          {
            serial_number: data.serial_number,
          },
          {
            created_by: {
              organization: {
                id: organizationId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (deviceAlreadyExists) {

      throw new BadRequestException('Device already exists in your organization.');

    }

    const device = await this.prisma.device.create({
      data: {
        title: data.title,
        description: data.description,
        serial_number: data.serial_number,
        uri: data.uri,
        category: data.category as MeasurementType,
        created_by: {
          connect: {
            id: userId,
          },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        serial_number: true,
        uri: true,
        category: true,
        created_by: {
          select: {
            id: true,
            first_name: true,
            middle_name: true,
            last_name: true,
            email: true,
          },
        },
        patient_devices: {
          select: {
            issued_to: {
              select: {
                user: {
                  select: {
                    id: true,
                    first_name: true,
                    middle_name: true,
                    last_name: true,
                    email: true,
                  },
                },
              },
            },
            issued_by: {
              select: {
                id: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                email: true,
              },
            },
            issued_at: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

    return device;
  }


  public async assignDevice(userId, data: PatientDeviceDTO) {
    console.log(data, 'device data ===========>>>');
    //Check if the device is already issued
    const alreadyIssued = await this.prisma.patientDevice.findFirst({
      where: {
        device_id: data.device_id,
      },
      select: {
        id: true,
      },
    });

    if (alreadyIssued) {
      throw new BadRequestException('This device is already issued to another patient.');
    }

    // Step 2: Create new issuance
    const patientDevice = await this.prisma.patientDevice.create({
      data: {
        device: { connect: { id: data.device_id } },
        issued_to: { connect: { user_id: data.issued_to } },
        issued_by: { connect: { id: userId } },
        issued_at: new Date(),
      },
    });

    return patientDevice;
  }

  public async updateDevice(
    deviceId: string,
    organizationId: string,
    data: DeviceDTO,
  ) {
    // check if user can edit the device
    const canEditDevice = await this.prisma.device.findFirst({
      where: {
        AND: [
          {
            id: deviceId,
          },
          {
            created_by: {
              organization: {
                id: organizationId,
              },
            },
          },
        ],
      },
      select: {
        id: true,
      },
    });

    if (!canEditDevice) {
      throw new Error('Can not edit device');
    }

    // check if device does not already exists
    const deviceAlreadyExists = await this.prisma.device.findFirst({
      where: {
        serial_number: data.serial_number,
      },
      select: {
        id: true,
      },
    });

    if (deviceAlreadyExists && deviceAlreadyExists.id !== deviceId) {
      throw new Error('Device already exists');
    }

    const device = await this.prisma.device.update({
      where: {
        id: deviceId,
      },
      data: {
        title: data.title,
        description: data.description,
        serial_number: data.serial_number,
        uri: data.uri,
        category: data.category as MeasurementType,
      },
      select: {
        id: true,
        title: true,
        description: true,
        serial_number: true,
        uri: true,
        category: true,
        created_by: {
          select: {
            id: true,
            first_name: true,
            middle_name: true,
            last_name: true,
            email: true,
          },
        },
        patient_devices: {
          select: {
            issued_to: {
              select: {
                user: {
                  select: {
                    id: true,
                    first_name: true,
                    middle_name: true,
                    last_name: true,
                    email: true,
                  },
                },
              },
            },
            issued_by: {
              select: {
                id: true,
                first_name: true,
                middle_name: true,
                last_name: true,
                email: true,
              },
            },
            issued_at: true,
          },
        },
        created_at: true,
        updated_at: true,
      },
    });

    return device;
  }

  public async manageDevice(
    userId: string,
    organizationId: string,
    role: UserRole,
    data: ManageDeviceDTO,
  ) {
    if (role === 'SUPERADMIN') {
      const validPatients = await this.prisma.patient.findMany({
        where: {
          AND: [
            {
              user: {
                id: {
                  in: data.patient_ids,
                },
              },
            },
            {
              user: {
                organization: {
                  id: organizationId,
                },
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      if (!validPatients) {
        throw new Error(
          'Either some or all patient(s) do not exist in your organization',
        );
      }

      const validDevice = await this.prisma.device.findFirst({
        where: {
          id: data.device_id,
          created_by: {
            organization_id: organizationId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!validDevice) {
        throw new Error(
          'Either device does not exist or is not in your organization',
        );
      }
    } else {
      // For ADMIN, DOCTOR and NURSE
      const res = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          associated_branches: {
            select: {
              id: true,
            },
          },
        },
      });

      const validPatients = await this.prisma.patient.findMany({
        where: {
          AND: [
            {
              user: {
                id: {
                  in: data.patient_ids,
                },
              },
            },
            {
              user: {
                organization: {
                  id: organizationId,
                },
              },
            },
            {
              user: {
                associated_branches: {
                  some: {
                    id: res.associated_branches[0]?.id,
                  },
                },
              },
            },
          ],
        },
        select: {
          id: true,
        },
      });

      if (!validPatients) {
        throw new Error(
          'Either some or all patient(s) do not exist in your organization/branch',
        );
      }

      const validDevice = await this.prisma.device.findFirst({
        where: {
          id: data.device_id,
          created_by: {
            AND: [
              {
                organization_id: organizationId,
              },
              {
                associated_branches: {
                  some: {
                    id: res.associated_branches[0]?.id,
                  },
                },
              },
            ],
          },
        },
        select: {
          id: true,
        },
      });

      if (!validDevice) {
        throw new Error(
          'Either device does not exist or is not in your organization/branch',
        );
      }
    }

    // Get all existing patient devices for the given device
    const existingPatientDevices = await this.prisma.patientDevice.findMany({
      where: {
        device_id: data.device_id,
      },
      select: {
        id: true,
        issued_to_user_id: true,
      },
    });

    // Create sets for efficient lookup
    const existingPatientIds = new Set(
      existingPatientDevices.map((pd) => pd.issued_to_user_id),
    );
    const newPatientIds = new Set(data.patient_ids);

    // Identify patient IDs to delete, keep, and add
    const patientIdsToDelete = existingPatientDevices.filter(
      (pd) => !newPatientIds.has(pd.issued_to_user_id),
    );
    const patientIdsToAdd = data.patient_ids.filter(
      (id) => !existingPatientIds.has(id),
    );

    // Perform the operations
    const deletePromise = this.prisma.patientDevice.deleteMany({
      where: {
        id: {
          in: patientIdsToDelete.map((pd) => pd.id),
        },
      },
    });

    const addPromise = this.prisma.patientDevice.createMany({
      data: patientIdsToAdd.map((patientId) => ({
        device_id: data.device_id,
        issued_to_user_id: patientId,
        issued_by_user_id: userId,
      })),
    });

    // Execute both operations concurrently
    await this.prisma.$transaction([deletePromise, addPromise]);

    // Return the updated list of patient devices
    return await this.prisma.patientDevice.findMany({
      where: {
        device_id: data.device_id,
      },
      select: {
        id: true,
        issued_to_user_id: true,
      },
    });
  }

  public async deleteDevice(
    userId: string,
    organizationId: string,
    role: UserRole,
    deviceId: string,
  ) {
    if (role === 'SUPERADMIN') {
      const validDevice = await this.prisma.device.findFirst({
        where: {
          id: deviceId,
          created_by: {
            organization_id: organizationId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!validDevice) {
        throw new Error(
          'Either device does not exist or is not in your organization',
        );
      }
    } else {
      // For ADMIN, DOCTOR and NURSE
      const res = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          associated_branches: {
            select: {
              id: true,
            },
          },
        },
      });

      const validDevice = await this.prisma.device.findFirst({
        where: {
          id: deviceId,
          created_by: {
            OR: [
              {
                organization_id: organizationId,
              },
              {
                associated_branches: {
                  some: {
                    id: res.associated_branches[0]?.id,
                  },
                },
              },
            ],
          },
        },
        select: {
          id: true,
        },
      });

      if (!validDevice) {
        throw new Error(
          'Either device does not exist or is not in your organization/branch',
        );
      }
    }

    return await this.prisma.device.delete({
      where: {
        id: deviceId,
      },
      select: {
        id: true,
      },
    });
  }
}
