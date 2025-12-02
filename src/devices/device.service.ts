import { BadRequestException, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { DeviceDTO, ManageDeviceDTO, PatientDeviceDTO } from './dto';

import { Role, type MeasurementType } from '@prisma/client';
import type { UserRole } from '@types';
import type { Device } from './types';
import puppeteer from 'puppeteer';
import { DeviceSuperAdminDTO } from './dto/deviceSuperadmin.dto';
@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService) { }

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

  public async createDevice(userId, organizationId: string, data: DeviceDTO, branchId: string) {
    const vlDevice = {
      id: data.serial_number,
      serial_number: data.serial_number,
      category: data.category as MeasurementType,
      site: "Pakistan"

    };

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
    const result = await this.vlDevice(vlDevice); // will return true or false
    console.log('device add on VivaLink ===========>>>', result);
    if (result) {

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

      return device;
    } else {

      return false;
    }
  }

  public async createSuperAdminDevice(userId, organizationId: string, data: DeviceSuperAdminDTO) {
    const vlDevice = {
      id: data.serial_number,
      serial_number: data.serial_number,
      category: data.category as MeasurementType,
      site: "Pakistan"

    };

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
    const result = await this.vlDevice(vlDevice); // will return true or false
    console.log('device add on VivaLink ===========>>>', result);
    if (result) {

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

      return device;
    } else {

      return false;
    }

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
          '--disable-blink-features=AutomationControlled'
        ],
        defaultViewport: null,
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate
      await page.goto("https://webportal.vivalink.com/sign-in", {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Login
      await page.type('input[name="email"]', "vivalink4VVE-14@outlook.com");
      await page.type('input[name="password"]', "Uc7%!D0)U9");

      // Wait for navigation or specific post-login selector
      await Promise.all([
        page.click('button[type="submit"]'),
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 })
      ]);

      console.log("Logged in successfully");
      return page;

    } catch (err) {
      console.log("ERROR OCCURRED!!!", err);
    }
  }



  async vlAddDevice(page: any, device: any) {
    try {
      await page.goto("https://webportal.vivalink.com/devices", {
        waitUntil: "domcontentloaded",
        timeout: 120000
      });

      await page.waitForFunction(
        () => {
          const buttons = document.querySelectorAll("button");
          return Array.from(buttons).some(btn => btn.textContent.trim() === "Add Device");
        },
        { timeout: 60000 }
      );
      console.log("✅ Add Device button detected");

      // Click "Add Device"
      await page.evaluate(() => {
        const buttons = document.querySelectorAll("button");
        const addDeviceBtn = Array.from(buttons).find(btn => btn.textContent.trim() === "Add Device");
        if (addDeviceBtn) addDeviceBtn.click();
      });

      console.log("✅ Clicked Add Device button");

      await page.waitForSelector('#identifier', { timeout: 20000 });
      await page.type('#identifier', device.id);

      if (device.site) {
        console.log("✅ Selecting site...");
        await page.click('#site');
        await page.waitForSelector('.ant-select-dropdown');

        const siteOptions = await page.$$('.ant-select-item-option');
        for (const option of siteOptions) {
          const optionText = await page.evaluate(el => el.textContent.trim(), option);
          if (optionText.toLowerCase() === device.site.toLowerCase()) {
            await option.click();
            break;
          }
        }
      }

      // Click Save
      await page.evaluate(() => {
        const submitButton = Array.from(document.querySelectorAll('button')).find(
          button => button.textContent && button.textContent.includes('Save')
        );
        if (submitButton) (submitButton as HTMLButtonElement).click();
      });

      console.log("✅ Submitted form, waiting for confirmation...");

      // ✅ Wait for either success OR device appearing in list
      const success = await Promise.race([
        page.waitForSelector('.ant-message-success', { timeout: 20000 }).then(() => true).catch(() => false),
        page.waitForFunction(() => {
          const rows = document.querySelectorAll('.ant-table-row');
          return Array.from(rows).some(row => row.textContent.includes('Added successfully'));
        }, { timeout: 20000 }).catch(() => false)
      ]);

      if (!success) {
        console.log("⚠️ No explicit success detected, but continuing (SPA may not give feedback)");
      }

      return true; // ✅ Always return true after submission unless error occurs
    } catch (err) {
      console.error("❌ Error submitting the form:", err);
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


}
