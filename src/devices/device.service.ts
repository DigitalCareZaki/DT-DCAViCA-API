import { BadRequestException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { DeviceDTO, ManageDeviceDTO, PatientDeviceDTO } from './dto';

import { Role, VivalinkSyncStatus, type MeasurementType } from '@prisma/client';
import type { UserRole } from '@types';
import type { Device, VivalinkDeviceSyncResult, AddDeviceResult, TriggerDeviceVivalinkSyncResult, AssignDeviceResult, VivalinkAssignmentSyncResult } from './types';
import puppeteer from 'puppeteer';
import { DeviceSuperAdminDTO } from './dto/deviceSuperadmin.dto';
import { VivalinkWebPortalTokenService } from 'src/vivalink/vivalink-webportal-token.service';

interface VivalinkPortalDeviceDto {
  type: number;
  identifier: string;
  site: string
}

interface AssignVivalinkDeviceDto {
  device: string;
  patient: string;
}
@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService, private vlTokenService: VivalinkWebPortalTokenService) { }

  private readonly logger = new Logger(DeviceService.name);

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
          site: {
            select: {
              vivalinkSiteId: true,
            },
          },
        },
      });

      if (!deviceData) {
        return {
          attempted: true,
          success: false,
          error: 'Device not found',
        };
      }

      // Prepare payload for Vivalink API
      // Device type mapping: ECG = 1 (based on typical Vivalink device types)
      const deviceTypeMap: Record<string, number> = {
        'ECG': 100,
        'SPO2': 101,
        'BLOODPRESSURE': 3,
        'BLOODGLUCOSE': 4,
        'TEMPERATURE': 5,
      };

      const vlDevicePayload = {
        type: deviceTypeMap[deviceData.category] || 101,
        identifier: deviceData.serial_number,
        site: deviceData.site?.vivalinkSiteId || null,
      };

      console.log('Syncing device to Vivalink:', vlDevicePayload);

      const syncResponse = await this.addDeviceToVivalinkPortal(vlDevicePayload as any);
      const syncSuccess = syncResponse && syncResponse.code === 0;

      if (syncSuccess) {
        await this.prisma.device.update({
          where: { id: deviceId },
          data: {
            vivalink_synced: true,
            vivalink_synced_at: new Date(),
            vivalink_sync_error: null,
            cardiac_monitoring: VivalinkSyncStatus.YES,
            vivalinkId: syncResponse.data?._id || syncResponse.data?.id || null,
          },
        });

        return {
          attempted: true,
          success: true,
          syncedAt: new Date(),
        };
      } else {
        const errorMsg = syncResponse?.message || 'Failed to add device in Vivalink portal';
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


  public async assignDevice(userId: string, data: PatientDeviceDTO): Promise<AssignDeviceResult> {
    console.log(data, 'device data ===========>>>');

    // Check if the device is already issued
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

    // Get device and patient details for Vivalink sync
    const device = await this.prisma.device.findUnique({
      where: { id: data.device_id },
      select: {
        id: true,
        vivalinkId: true,
        vivalink_synced: true,
        serial_number: true,
      },
    });

    const patient = await this.prisma.patient.findUnique({
      where: { user_id: data.issued_to },
      select: {
        id: true,
        vivalinkId: true,
        vivalink_synced: true,
      },
    });

    if (!device) {
      throw new BadRequestException('Device not found.');
    }

    if (!patient) {
      throw new BadRequestException('Patient not found.');
    }

    let vivalinkSyncResult: VivalinkAssignmentSyncResult = {
      attempted: false,
      success: false,
    };

    // Step 1: Sync to Vivalink first if both device and patient are synced
    if (device.vivalink_synced && patient.vivalink_synced && device.vivalinkId && patient.vivalinkId) {
      try {
        const vlAssignPayload = {
          device: device.vivalinkId,
          patient: patient.vivalinkId,
        };

        console.log('Syncing device assignment to Vivalink:', vlAssignPayload);

        const vlResponse = await this.assignDeviceToPatient(vlAssignPayload);
        const vlSuccess = vlResponse && vlResponse.code === 0;

        if (vlSuccess) {
          vivalinkSyncResult = {
            attempted: true,
            success: true,
            syncedAt: new Date(),
          };
        } else {
          vivalinkSyncResult = {
            attempted: true,
            success: false,
            error: vlResponse?.message || 'Failed to assign device in Vivalink',
          };
          // Don't throw - proceed with local assignment even if Vivalink fails
          console.error('Vivalink device assignment failed:', vlResponse);
        }
      } catch (error) {
        console.error('Vivalink device assignment error:', error);
        vivalinkSyncResult = {
          attempted: true,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown Vivalink sync error',
        };
        // Don't throw - proceed with local assignment even if Vivalink fails
      }
    } else {
      // Log why Vivalink sync was skipped
      console.log('Skipping Vivalink sync - Device synced:', device.vivalink_synced,
        'Patient synced:', patient.vivalink_synced);
    }

    // Step 2: Create new issuance in Prisma
    const patientDevice = await this.prisma.patientDevice.create({
      data: {
        device: { connect: { id: data.device_id } },
        issued_to: { connect: { user_id: data.issued_to } },
        issued_by: { connect: { id: userId } },
        issued_at: new Date(),
      },
    });

    return {
      success: true,
      patientDeviceId: patientDevice.id,
      vivalinkSync: vivalinkSyncResult,
    };
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


  async addDeviceToVivalinkPortal(device: VivalinkDeviceSyncResult) {
    const url = `${this.vlWebportalUrl}/devices`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.vlWebportalToken}`,
      },
      body: JSON.stringify(device),
    });

    const result = await response.json();
    return result;
  }

  async assignDeviceToPatient(data: AssignVivalinkDeviceDto) {
    const url = `${this.vlWebportalUrl}/patientDevices`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.vlWebportalToken}`,
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result;
  }

  async getVivalinkDevices() {
    const url = `${this.vlWebportalUrl}/devices`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.vlWebportalToken}`,
      },
    });

    const result = await response.json();
    return result;
  }

}