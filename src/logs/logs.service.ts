import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { PrismaService } from 'src/prisma/prisma.service';

import type { GetLogsProps } from './types';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) { }

  public async getLogs(user: UserRes, page: number, limit: number): Promise<{ data: GetLogsProps[]; pagination: any } | GetLogsProps[]> {

    if (user.role === 'SUPERADMIN') {
      return this.getSuperAdminLogs(user.organization_id, user.id, page, limit);
    }
    if (user.role === 'ADMIN') return this.getAdminLogs(user.id, page, limit);
    if (user.role === 'DOCTOR') return this.getDoctorLogs(user.id, page, limit);
    if (user.role === 'MASTER') return this.getMasterLogs(page, limit);

    return [];
  }

  private async getMasterLogs(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [logs, totalItems] = await this.prisma.$transaction([
      this.prisma.logs.findMany({
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          method: true,
          endpoint: true,
          module: true,
          platform: true,
          user: {
            select: {
              middle_name: true,
              first_name: true,
              last_name: true,
              role: true,
              email: true,
              uri: true,
            },
          },
          created_at: true,
        },
      }),
      this.prisma.logs.count(),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
      data: logs,
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

  private async getDoctorLogs(user_id: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [logs, totalItems] = await this.prisma.$transaction([
      this.prisma.logs.findMany({
        where: {
          user: {
            AND: [
              {
                role: 'PATIENT',
              },
              {
                patient: {
                  doctors: {
                    some: {
                      user_id,
                    },
                  },
                },
              },
            ],
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          method: true,
          endpoint: true,
          module: true,
          platform: true,
          user: {
            select: {
              middle_name: true,
              first_name: true,
              last_name: true,
              role: true,
              email: true,
              uri: true,
            },
          },
          created_at: true,
        },
      }),
      this.prisma.logs.count({
        where: {
          user: {
            AND: [
              {
                role: 'PATIENT',
              },
              {
                patient: {
                  doctors: {
                    some: {
                      user_id,
                    },
                  },
                },
              },
            ],
          },
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
      data: logs,
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

  private async getAdminLogs(user_id: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const res = await this.prisma.user.findUniqueOrThrow({
      where: { id: user_id },
      select: {
        associated_branches: {
          select: {
            id: true,
          },
        },
      },
    });
    const [logs, totalItems] = await this.prisma.$transaction([
      this.prisma.logs.findMany({
        where: {
          user: {
            AND: [
              {
                associated_branches: {
                  some: {
                    id: res.associated_branches[0]?.id,
                  },
                },
              },
              {
                NOT: {
                  id: user_id,
                },
              },
            ],
          },
        },
        orderBy: {
          created_at: 'desc',
        },
        select: {
          id: true,
          method: true,
          endpoint: true,
          module: true,
          platform: true,
          user: {
            select: {
              middle_name: true,
              first_name: true,
              last_name: true,
              role: true,
              email: true,
              uri: true,
            },
          },
          created_at: true,
        },
      }),
      this.prisma.logs.count({
        where: {
          user: {
            AND: [
              {
                associated_branches: {
                  some: {
                    id: res.associated_branches[0]?.id,
                  },
                },
              },
              {
                NOT: {
                  id: user_id,
                },
              },
            ],
          },
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
      data: logs,
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

  private async getSuperAdminLogs(
    organization_id: string,
    current_user_id: string,
    page: number,
    limit: number,
  ) {

    const skip = (page - 1) * limit;
    const [logs, totalItems] = await this.prisma.$transaction([
      this.prisma.logs.findMany({
        where: {
          user: {
            AND: [
              {
                organization_id,
              },
              {
                NOT: {
                  id: current_user_id,
                },
              },
            ],
          },
        },
        orderBy: {
          created_at: 'desc',
        },

        select: {
          id: true,
          method: true,
          endpoint: true,
          module: true,
          platform: true,
          user: {
            select: {
              middle_name: true,
              first_name: true,
              last_name: true,
              role: true,
              email: true,
              uri: true,
            },
          },
          created_at: true,
        },
      }),
      this.prisma.logs.count({
        where: {
          user: {
            AND: [
              {
                organization_id,
              },
              {
                NOT: {
                  id: current_user_id,
                },
              },
            ],
          },
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
      data: logs,
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
