import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { DeviceDTO, ManageDeviceDTO, PatientDeviceDTO } from './dto';

import { Role, VivalinkSyncStatus, type MeasurementType } from '@prisma/client';
import type { UserRole } from '@types';
import type { Device, VivalinkDeviceSyncResult, AddDeviceResult, TriggerDeviceVivalinkSyncResult } from './types';
import puppeteer from 'puppeteer';
import { DeviceSuperAdminDTO } from './dto/deviceSuperadmin.dto';
import { VivalinkWebPortalTokenService } from 'src/vivalink/vivalink-webportal-token.service';
import { error } from 'console';
@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService, private vlTokenService: VivalinkWebPortalTokenService) { }

  private get vlWebportalUrl(): string {
    return this.vlTokenService.getBaseUrl();
  }
  private get vlWebportalToken(): string {
    return this.vlTokenService.getToken();
  }


  public async getAllDevices(
    targetId: string,
    role: UserRole,
    search: string,
    page: number = 1,
    limit: number = 10
  ) {

    console.log(search, "===>")
    const isSuperAdmin = role === Role.SUPERADMIN;

    const whereCondition: any = {
      ...(isSuperAdmin ? {} : { branchId: targetId }),
      ...(search
        ? {
          OR: [
            {
              title: {
                contains: search,
                mode: 'insensitive',
              },
            },
            {
              serial_number: {
                contains: search,
                mode: 'insensitive',
              },
            },
            // {
            //   category: search.toUpperCase() as MeasurementType

            // },
            {
              description: {
                contains: search,
                mode: 'insensitive',
              },
            },
          ],
        }
        : {}),
    };
    // const isSuperAdmin = role === Role.SUPERADMIN;
    // const whereCondition: any = isSuperAdmin
    //   ? search
    //     ? {
    //       OR: [
    //         {
    //           title: {
    //             contains: search,
    //             mode: 'insensitive',
    //           },
    //         },
    //         {
    //           description: {
    //             contains: search,
    //             mode: 'insensitive',
    //           },
    //         },
    //       ],
    //     }
    //     : {}
    //   : { branchId: targetId };

    const skip = (page - 1) * limit;
    const [devices, totalItems] = await this.prisma.$transaction([
      this.prisma.device.findMany({
        skip,
        take: limit,
        where: whereCondition,

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
          branch: {
            select: {
              id: true,
              name: true,
              location: true,
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
        where: whereCondition
      }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const enrichedTablet = devices.map((device) => {
      const isAssigned = device.patient_devices && device.patient_devices.length > 0;
      return {
        ...device,
        assigned: isAssigned,
      };
    });
    return {
      data: enrichedTablet,
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

  public async createDevice(userId: string, organizationId: string, data: DeviceDTO, branchId: string): Promise<AddDeviceResult> {
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

    // Create device in AViCA first
    const cardiacMonitoring = data.cardiac_monitoring || VivalinkSyncStatus.NO;

    const device = await this.prisma.device.create({
      data: {
        title: data.title,
        description: data.description,
        serial_number: data.serial_number,
        uri: data.uri,
        category: data.category as MeasurementType,
        cardiac_monitoring: cardiacMonitoring,
        created_by: {
          connect: {
            id: userId,
          },
        },
        branch: {
          connect: {
            id: branchId,
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

    let vivalinkResult: VivalinkDeviceSyncResult = {
      attempted: false,
      success: false,
    };

    // Handle Vivalink Sync Logic
    if (cardiacMonitoring === VivalinkSyncStatus.YES) {
      vivalinkResult = await this.syncDeviceToVivalink(device.id, data);
    }

    return {
      success: true,
      deviceId: device.id,
      cardiacMonitoring: cardiacMonitoring,
      vivalinkSync: vivalinkResult,
    };
  }

  /**
   * Sync a device to Vivalink portal
   * @param deviceId AViCA Device ID
   * @param data Device data for sync
   */
  async syncDeviceToVivalink(deviceId: string, data?: DeviceDTO): Promise<VivalinkDeviceSyncResult> {
    try {
      const deviceData = await this.prisma.device.findUnique({
        where: { id: deviceId },
        select: {
          id: true,
          serial_number: true,
          category: true,
        },
      });

      if (!deviceData) {
        return {
          attempted: true,
          success: false,
          error: 'Device not found',
        };
      }

      const vlDevicePayload = {
        id: deviceData.serial_number,
        serial_number: deviceData.serial_number,
        category: deviceData.category,
        site: 'Pakistan',
      };

      console.log('Syncing device to Vivalink:', vlDevicePayload);

      const syncSuccess = await this.vlDevice(vlDevicePayload);

      if (syncSuccess) {
        await this.prisma.device.update({
          where: { id: deviceId },
          data: {
            vivalink_synced: true,
            vivalink_synced_at: new Date(),
            vivalink_sync_error: null,
            cardiac_monitoring: VivalinkSyncStatus.YES,
          },
        });

        return {
          attempted: true,
          success: true,
          syncedAt: new Date(),
        };
      } else {
        const errorMsg = 'Failed to add device in Vivalink portal';
        await this.prisma.device.update({
          where: { id: deviceId },
          data: {
            vivalink_synced: false,
            vivalink_sync_error: errorMsg,
          },
        });

        return {
          attempted: true,
          success: false,
          error: errorMsg,
        };
      }
    } catch (error) {
      console.error('Vivalink device sync error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';

      await this.prisma.device.update({
        where: { id: deviceId },
        data: {
          vivalink_synced: false,
          vivalink_sync_error: errorMessage,
        },
      });

      return {
        attempted: true,
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Manually trigger Vivalink sync for a device (e.g. Later -> Yes flow)
   */
  async triggerDeviceVivalinkSync(deviceId: string): Promise<TriggerDeviceVivalinkSyncResult> {
    const device = await this.prisma.device.findUnique({
      where: { id: deviceId },
      select: { cardiac_monitoring: true, vivalink_synced: true },
    });

    if (!device) {
      return { success: false, error: 'Device not found' };
    }

    const syncResult = await this.syncDeviceToVivalink(deviceId);

    return {
      success: syncResult.success,
      error: syncResult.error,
      syncedAt: syncResult.syncedAt,
    };
  }

  public async createSuperAdminDevice(userId: string, organizationId: string, data: DeviceSuperAdminDTO): Promise<AddDeviceResult> {
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

    // Create device in AViCA first
    const cardiacMonitoring = data.cardiac_monitoring || VivalinkSyncStatus.NO;

    const device = await this.prisma.device.create({
      data: {
        title: data.title,
        description: data.description,
        serial_number: data.serial_number,
        uri: data.uri,
        category: data.category as MeasurementType,
        cardiac_monitoring: cardiacMonitoring,
        created_by: {
          connect: {
            id: userId,
          },
        },
        branch: {
          connect: {
            id: data.branch_id,
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

    let vivalinkResult: VivalinkDeviceSyncResult = {
      attempted: false,
      success: false,
    };

    // Handle Vivalink Sync Logic
    if (cardiacMonitoring === VivalinkSyncStatus.YES) {
      vivalinkResult = await this.syncDeviceToVivalink(device.id, data);
    }

    return {
      success: true,
      deviceId: device.id,
      cardiacMonitoring: cardiacMonitoring,
      vivalinkSync: vivalinkResult,
    };
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

  async vlDevice(device: any) {


    console.log(device, '=======> device');

    const page = await this.vlLogin();

    return await this.vlAddDevice(page, device);
    //console.log('result========================>>>Final', result);
    // if (result) {
    //   return 'Device added successfully';
    // } else {
    //   return 'Failed to add device';
    // }
  }

  async vlLogin() {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-blink-features=AutomationControlled',
          '--start-maximized',
        ],
        defaultViewport: null,
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate
      await page.goto('https://webportal.vivalink.com/sign-in', {
        waitUntil: 'networkidle0',
        timeout: 60000,
      });

      // Login
      await page.type('input[name="email"]', 'vivalink4VVE-14@outlook.com');
      await page.type('input[name="password"]', 'Uc7%!D0)U9');

      // Wait for navigation or specific post-login selector
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 }),
      ]);

      console.log('Logged in successfully');
      return page;
    } catch (err) {
      console.log('ERROR OCCURRED!!!', err);
    }
  }

  async vlAddDevice(page: any, device: any) {
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    try {
      // Navigate to devices page and wait for full load
      await page.goto('https://webportal.vivalink.com/devices', {
        waitUntil: 'networkidle0',
        timeout: 120000,
      });

      // Wait for page to be fully interactive
      await delay(2000);

      // Wait for and click "Add Device" button
      await page.waitForFunction(
        () => {
          const buttons = document.querySelectorAll('button');
          return Array.from(buttons).some(
            (btn) => btn.textContent?.trim() === 'Add Device',
          );
        },
        { timeout: 60000 },
      );
      console.log('✅ Add Device button detected');

      await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const addDeviceBtn = Array.from(buttons).find(
          (btn) => btn.textContent?.trim() === 'Add Device',
        );
        if (addDeviceBtn) (addDeviceBtn as HTMLButtonElement).click();
      });
      console.log('✅ Clicked Add Device button');

      // Wait for modal/form to appear
      await page.waitForSelector('#identifier', {
        visible: true,
        timeout: 30000,
      });
      await delay(500);

      // Clear and type device identifier
      await page.click('#identifier', { clickCount: 3 });
      await page.type('#identifier', device.id);
      console.log('✅ Entered device identifier:', device.id);

      // Handle site selection if provided
      if (device.site) {
        console.log('✅ Selecting site:', device.site);

        // Debug: capture form state
        const formState = await page.evaluate(() => {
          const siteWrapper = document
            .querySelector('#site')
            ?.closest('.ant-select');
          const siteInput = document.querySelector('#site');
          return {
            siteWrapperExists: !!siteWrapper,
            siteWrapperClass: siteWrapper?.className || 'N/A',
            siteInputExists: !!siteInput,
            siteInputTag: siteInput?.tagName || 'N/A',
            allSelectsOnPage: document.querySelectorAll('.ant-select').length,
            allDropdownsOnPage: document.querySelectorAll(
              '.ant-select-dropdown',
            ).length,
          };
        });
        console.log('🔍 Form state:', JSON.stringify(formState, null, 2));

        // Find the site select wrapper (Ant Design wraps input in .ant-select)
        const siteSelectWrapper = await page
          .$('#site')
          .then(async (el: any) =>
            el
              ? await el.evaluateHandle((e: Element) =>
                e.closest('.ant-select'),
              )
              : null,
          );

        if (siteSelectWrapper) {
          // Click the wrapper to open dropdown
          await siteSelectWrapper.click();
          console.log('✅ Clicked site select wrapper');
        } else {
          // Fallback: click directly on #site
          await page.click('#site');
          console.log('✅ Clicked #site directly');
        }

        await delay(1000);

        // Check for dropdown in document body (Ant portals dropdowns to body)
        const dropdownState = await page.evaluate(() => {
          const dropdowns = document.querySelectorAll('.ant-select-dropdown');
          const visibleDropdowns = Array.from(dropdowns).filter(
            (d) =>
              !d.classList.contains('ant-select-dropdown-hidden') &&
              (d as HTMLElement).offsetParent !== null,
          );
          return {
            totalDropdowns: dropdowns.length,
            visibleDropdowns: visibleDropdowns.length,
            dropdownClasses: Array.from(dropdowns).map((d) => d.className),
            options:
              visibleDropdowns.length > 0
                ? Array.from(
                  visibleDropdowns[0].querySelectorAll(
                    '.ant-select-item-option',
                  ),
                ).map((o) => o.textContent?.trim())
                : [],
          };
        });
        console.log(
          '🔍 Dropdown state:',
          JSON.stringify(dropdownState, null, 2),
        );

        // If no visible dropdown, try alternative methods
        if (dropdownState.visibleDropdowns === 0) {
          console.log('⚠️ No visible dropdown, trying keyboard navigation...');
          await page.focus('#site');
          await page.keyboard.press('Space');
          await delay(500);
          await page.keyboard.press('ArrowDown');
          await delay(1000);

          // Re-check dropdown state
          const retryState = await page.evaluate(() => {
            const dropdowns = document.querySelectorAll('.ant-select-dropdown');
            const visibleDropdowns = Array.from(dropdowns).filter(
              (d) => !d.classList.contains('ant-select-dropdown-hidden'),
            );
            return {
              visibleDropdowns: visibleDropdowns.length,
              options:
                visibleDropdowns.length > 0
                  ? Array.from(
                    visibleDropdowns[0].querySelectorAll(
                      '.ant-select-item-option',
                    ),
                  ).map((o) => o.textContent?.trim())
                  : [],
            };
          });
          console.log(
            '🔍 Retry dropdown state:',
            JSON.stringify(retryState, null, 2),
          );
        }

        // Select the site option by evaluating in page context
        const siteSelected = await page.evaluate((siteName: string) => {
          const options = document.querySelectorAll('.ant-select-item-option');
          for (const option of Array.from(options)) {
            const text = option.textContent?.trim().toLowerCase();
            if (text === siteName.toLowerCase()) {
              (option as HTMLElement).click();
              return { success: true, selected: option.textContent?.trim() };
            }
          }
          return {
            success: false,
            available: Array.from(options).map((o) => o.textContent?.trim()),
          };
        }, device.site);

        if (siteSelected.success) {
          console.log('✅ Site selected:', siteSelected.selected);
        } else {
          console.log(
            '⚠️ Site not found. Available options:',
            siteSelected.available,
          );
        }

        await delay(500);
      }

      // Click Save button
      const saveClicked = await page.evaluate(() => {
        const buttons = document.querySelectorAll('button');
        const saveBtn = Array.from(buttons).find(
          (btn) =>
            btn.textContent?.trim().toLowerCase() === 'save' ||
            btn.textContent?.toLowerCase().includes('save'),
        );
        if (saveBtn) {
          (saveBtn as HTMLButtonElement).click();
          return true;
        }
        return false;
      });

      if (!saveClicked) {
        console.error('❌ Save button not found');
        return false;
      }
      console.log('✅ Clicked Save button');

      // Wait for response - check multiple success indicators
      await delay(3000);

      const result = await page.evaluate((deviceId: string) => {
        // Check for success message (Ant Design message component)
        const successMsg = document.querySelector(
          '.ant-message-success, .ant-message-notice-success',
        );
        if (successMsg)
          return {
            success: true,
            reason: 'success-message',
            message: successMsg.textContent,
          };

        // Check for error message
        const errorMsg = document.querySelector(
          '.ant-message-error, .ant-message-notice-error',
        );
        if (errorMsg)
          return {
            success: false,
            reason: 'error-message',
            error: errorMsg.textContent,
          };

        // Check for warning (like "device already exists")
        const warningMsg = document.querySelector(
          '.ant-message-warning, .ant-message-notice-warning',
        );
        if (warningMsg)
          return {
            success: true,
            reason: 'warning-message',
            message: warningMsg.textContent,
          };

        // Check for any notification/alert
        const notification = document.querySelector(
          '.ant-notification, .ant-alert',
        );
        if (notification)
          return {
            success: true,
            reason: 'notification',
            message: notification.textContent,
          };

        // Check if modal/drawer closed (form no longer visible)
        const identifierField = document.querySelector('#identifier');
        const isModalVisible =
          identifierField &&
          (identifierField as HTMLElement).offsetParent !== null;
        if (!isModalVisible) return { success: true, reason: 'form-closed' };

        // Check if device appears in table (in background)
        const rows = document.querySelectorAll('.ant-table-row');
        const deviceInTable = Array.from(rows).some((row) =>
          row.textContent?.includes(deviceId),
        );
        if (deviceInTable) return { success: true, reason: 'device-in-table' };

        // Check for form validation errors
        const formErrors = document.querySelectorAll(
          '.ant-form-item-explain-error',
        );
        if (formErrors.length > 0) {
          return {
            success: false,
            reason: 'validation-error',
            error: Array.from(formErrors)
              .map((e) => e.textContent)
              .join(', '),
          };
        }

        return {
          success: null,
          reason: 'unknown',
          formStillVisible: !!identifierField,
        };
      }, device.id);

      console.log('🔍 Submit result:', JSON.stringify(result, null, 2));

      if (result.success === false) {
        console.error('❌ Form submission failed:', result.error);
        return false;
      }

      if (result.success === true) {
        console.log('✅ Device added successfully via:', result.reason);
        return true;
      }

      // Unknown state - wait a bit more and verify
      await delay(3000);
      await page.reload({ waitUntil: 'networkidle0', timeout: 60000 });

      const deviceExists = await page.evaluate((deviceId: string) => {
        const rows = document.querySelectorAll('.ant-table-row');
        return Array.from(rows).some((row) =>
          row.textContent?.includes(deviceId),
        );
      }, device.id);

      if (deviceExists) {
        console.log('✅ Device verified in table after reload');
        return true;
      }

      console.log(
        '⚠️ Could not verify device was added, but no error detected',
      );
      return true;
    } catch (err) {
      console.error('❌ Error in vlAddDevice:', err);

      // Take screenshot for debugging
      try {
        await page.screenshot({
          path: '/tmp/vivalink-error.png',
          fullPage: true,
        });
        console.log('📸 Error screenshot saved to /tmp/vivalink-error.png');
      } catch (screenshotErr) {
        console.log('Could not save screenshot:', screenshotErr);
      }

      return false;
    }
  }

  // async vlAddDevice(page: any, device: any) {


  //   try {
  //     // Navigate to device add page

  //     await page.goto("https://webportal.vivalink.com/devices", {
  //       waitUntil: "domcontentloaded",
  //       timeout: 120000
  //     });

  //     // Wait for the 'Add Device' button's inner text
  //     await page.waitForFunction(
  //       () => {
  //         const buttons = document.querySelectorAll("button");
  //         return Array.from(buttons).some(
  //           btn => btn.textContent.trim() === "Add Device"
  //         );
  //       },
  //       { timeout: 60000 }
  //     );

  //     console.log("✅ Add Device button detected");

  //     // Click the button by its text
  //     await page.evaluate(() => {
  //       const buttons = document.querySelectorAll("button");
  //       const addDeviceBtn = Array.from(buttons).find(
  //         btn => btn.textContent.trim() === "Add Device"
  //       );
  //       if (addDeviceBtn) {
  //         addDeviceBtn.click();
  //       }
  //     });

  //     console.log("✅ Clicked Add Device button");

  //     await page.type('#identifier', device.id);
  //     if (device.site) {
  //       console.log("select site")
  //       await page.click('#site');
  //       await page.waitForSelector('.ant-select-dropdown');

  //       // Get site dropdown options
  //       const siteOptions = await page.$$('.ant-select-item-option');

  //       // Find and click the correct site option
  //       for (const option of siteOptions) {
  //         const optionText = await page.evaluate(el => el.textContent.trim(), option);
  //         if (optionText.toLowerCase() === device.site.toLowerCase()) {
  //           await option.click();
  //           break;
  //         }
  //       }
  //     }




  //     await page.evaluate(() => {
  //       console.log('Trying to submit the form in 1st attempt');
  //       const submitButton = Array.from(document.querySelectorAll('button')).find(
  //         button => button.textContent && button.textContent.includes('Save')
  //       );
  //       if (submitButton) (submitButton as HTMLButtonElement).click();
  //     });
  //     console.log('Trying to submit the form in 2nd attempt');
  //     // Second attempt - click by more specific selector
  //     // await page.evaluate(() => {
  //     //   console.log('Trying to submit the form in 2nd attempt');
  //     //   const form = document.querySelector('#patient-form');
  //     //   if (form) {
  //     //     const submitButton = form.querySelector('button[type="submit"]');
  //     //     if (submitButton) (submitButton as HTMLButtonElement).click();
  //     //   }
  //     // });

  //     const result = await Promise.race([
  //       page.waitForNavigation({ timeout: 30000 }).then(() => 'navigation'),
  //       page.waitForSelector('.success-message', { timeout: 30000 }).then(() => 'success'),
  //       new Promise(resolve => setTimeout(() => resolve('timeout'), 30000))
  //     ]);


  //     if (!result || result === 'timeout' || (result !== 'success' && result !== 'navigation')) {
  //       console.log('Timeout or unexpected result:', result);
  //       return false;
  //       // Continue anyway, as the form might have been submitted successfully despite the timeout
  //     }

  //     return true;
  //   } catch (err) {
  //     console.log("Error submitting the form:", err);
  //     return false;
  //   }
  // }


  async deviceHistory(deviceId: string, patientvlId: string) {
    try {
      const vlDevice = await this.getAllDeviceHistoryVl();
      const dt = vlDevice.data
        .filter(
          (x) =>
            x.title === deviceId &&
            x.patient?.id === patientvlId
        )
        .map((x) => ({
          title: x.title,
          action: x.action,
          createdAt: x.createdAt,
          updatedAt: x.updatedAt,
        }));

      const res = this.getDeviceUsageDuration(dt);
      return res;
    } catch (err) {
      throw err;
    }
  }


  private async getAllDeviceHistoryVl() {
    const url = `${this.vlWebportalUrl}/operation-log?$sort[createdAt]=-1&$skip=0&$limit=10000&target=Device`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${this.vlWebportalToken}` },
    });
    return response.json();
  }
  private getDeviceUsageDuration(history: any[]) {
    const bind = history.find(x => x.action === 'DeviceBind');
    const unbind = history.find(x => x.action === 'DeviceUnbind');

    if (!bind || !unbind) {
      return null; // incomplete history
    }

    const start = new Date(bind.createdAt).getTime();
    const end = new Date(unbind.createdAt).getTime();

    const diffMs = end - start;

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    const days = Math.floor(hours / 24);

    return {
      title: bind.title,
      startTime: bind.createdAt,
      endTime: unbind.createdAt,
      durationMs: diffMs,
      durationHuman: `${days}d ${hours % 24}h ${remainingMinutes}m`,
    };
  }


}