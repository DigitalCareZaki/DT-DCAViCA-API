import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { TabletDTO, ManageTabletDTO } from './dto';

import type { MeasurementType } from '@prisma/client';
import type { UserRole } from '@types';
import type { Tablet } from './types';

@Injectable()
export class TabletService {
  constructor(private prisma: PrismaService) { }

  public async getAllTablets(
    userId: string,
    organizationId: string,
    role: UserRole,
    search: string,
    page: number = 1,
    limit: number = 10
  ) {
    if (role === 'SUPERADMIN') {
      const skip = (page - 1) * limit;
      const [tablets, totalItems] = await this.prisma.$transaction([
        this.prisma.tablet.findMany({
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
                serial_number: {
                  contains: search,
                  mode: 'insensitive',
                },
              }
            ],
          },
          select: {
            id: true,
            title: true,
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
            patient_tablets: {
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
        this.prisma.tablet.count({
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
                serial_number: {
                  contains: search,
                  mode: 'insensitive',
                },
              }
            ],
          },
        }),
      ]);
      const totalPages = Math.ceil(totalItems / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      return {
        data: tablets,
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
      const [tablets, totalItems] = await this.prisma.$transaction([
        this.prisma.tablet.findMany({
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
                    serial_number: {
                      contains: search,
                      mode: 'insensitive',
                    },

                  }
                ],
              },
            ],
          },
          select: {
            id: true,
            title: true,
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
            patient_tablets: {
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
        this.prisma.tablet.count({
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
                    serial_number: {
                      contains: search,
                      mode: 'insensitive',
                    },
                  }
                ],
              },
            ],
          },
        }),
      ]);


      const totalPages = Math.ceil(totalItems / limit);
      const hasNextPage = page < totalPages;
      const hasPrevPage = page > 1;
      const enrichedtablet = tablets.map((tablet) => {
        const isAssigned = tablet.patient_tablets && tablet.patient_tablets.length > 0;
        return {
          ...tablet,
          assigned: isAssigned,
        };
      });

      return {
        data: enrichedtablet,
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

  public async getSingleTablet(
    tabletId: string,
    userId: string,
    organizationId: string,
    role: UserRole,
  ) {
    if (role === 'SUPERADMIN') {
      return await this.prisma.tablet.findUniqueOrThrow({
        where: {
          id: tabletId,
          created_by: {
            organization: {
              id: organizationId,
            },
          },
        },
        select: {
          id: true,
          title: true,
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
          patient_tablets: {
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

      return await this.prisma.tablet.findUniqueOrThrow({
        where: {
          id: tabletId,
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
          patient_tablets: {
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

  public async getAllTabletsForPatient(
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
      return await this.prisma.tablet.findMany({
        where: {
          patient_tablets: {
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
          patient_tablets: {
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

      return await this.prisma.tablet.findMany({
        where: {
          patient_tablets: {
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
          patient_tablets: {
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

  public async createTablet(userId, organizationId: string, data: TabletDTO) {
    // check if tablet does not already exist in organization
    const tabletAlreadyExists = await this.prisma.tablet.findFirst({
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

    if (tabletAlreadyExists) {
      throw new Error('Tablet already exists in your organization');
    }

    const tablet = await this.prisma.tablet.create({
      data: {
        title: data.title,
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
        patient_tablets: {
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

    return tablet;
  }

  public async updateTablet(
    tabletId: string,
    organizationId: string,
    data: TabletDTO,
  ) {
    // check if user can edit the tablet
    const canEditTablet = await this.prisma.tablet.findFirst({
      where: {
        AND: [
          {
            id: tabletId,
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

    if (!canEditTablet) {
      throw new Error('Can not edit tablet');
    }

    // check if tablet does not already exists
    const tabletAlreadyExists = await this.prisma.tablet.findFirst({
      where: {
        serial_number: data.serial_number,
      },
      select: {
        id: true,
      },
    });

    if (tabletAlreadyExists && tabletAlreadyExists.id !== tabletId) {
      throw new Error('Tablet already exists');
    }

    const tablet = await this.prisma.tablet.update({
      where: {
        id: tabletId,
      },
      data: {
        title: data.title,
        serial_number: data.serial_number,
        uri: data.uri,
        category: data.category as MeasurementType,
      },
      select: {
        id: true,
        title: true,
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
        patient_tablets: {
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

    return tablet;
  }

  public async manageTablet(
    userId: string,
    organizationId: string,
    role: UserRole,
    data: ManageTabletDTO,
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

      const validTablet = await this.prisma.tablet.findFirst({
        where: {
          id: data.tablet_id,
          created_by: {
            organization_id: organizationId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!validTablet) {
        throw new Error(
          'Either tablet does not exist or is not in your organization',
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

      const validTablet = await this.prisma.tablet.findFirst({
        where: {
          id: data.tablet_id,
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

      if (!validTablet) {
        throw new Error(
          'Either tablet does not exist or is not in your organization/branch',
        );
      }
    }

    // Get all existing patient tablets for the given tablet
    const existingPatientTablets = await this.prisma.patientTablet.findMany({
      where: {
        tablet_id: data.tablet_id,
      },
      select: {
        id: true,
        issued_to_user_id: true,
      },
    });

    // Create sets for efficient lookup
    const existingPatientIds = new Set(
      existingPatientTablets.map((pd) => pd.issued_to_user_id),
    );
    const newPatientIds = new Set(data.patient_ids);

    // Identify patient IDs to delete, keep, and add
    const patientIdsToDelete = existingPatientTablets.filter(
      (pd) => !newPatientIds.has(pd.issued_to_user_id),
    );
    const patientIdsToAdd = data.patient_ids.filter(
      (id) => !existingPatientIds.has(id),
    );

    // Perform the operations
    const deletePromise = this.prisma.patientTablet.deleteMany({
      where: {
        id: {
          in: patientIdsToDelete.map((pd) => pd.id),
        },
      },
    });

    const addPromise = this.prisma.patientTablet.createMany({
      data: patientIdsToAdd.map((patientId) => ({
        tablet_id: data.tablet_id,
        issued_to_user_id: patientId,
        issued_by_user_id: userId,
      })),
    });

    // Execute both operations concurrently
    await this.prisma.$transaction([deletePromise, addPromise]);

    // Return the updated list of patient tablets
    return await this.prisma.patientTablet.findMany({
      where: {
        tablet_id: data.tablet_id,
      },
      select: {
        id: true,
        issued_to_user_id: true,
      },
    });
  }

  public async deleteTablet(
    userId: string,
    organizationId: string,
    role: UserRole,
    tabletId: string,
  ) {
    if (role === 'SUPERADMIN') {
      const validTablet = await this.prisma.tablet.findFirst({
        where: {
          id: tabletId,
          created_by: {
            organization_id: organizationId,
          },
        },
        select: {
          id: true,
        },
      });

      if (!validTablet) {
        throw new Error(
          'Either tablet does not exist or is not in your organization',
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

      const validTablet = await this.prisma.tablet.findFirst({
        where: {
          id: tabletId,
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

      if (!validTablet) {
        throw new Error(
          'Either tablet does not exist or is not in your organization/branch',
        );
      }
    }

    return await this.prisma.tablet.delete({
      where: {
        id: tabletId,
      },
      select: {
        id: true,
      },
    });
  }
}
