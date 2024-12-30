import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { PrismaService } from 'src/prisma/prisma.service';

import type { GetLogsProps } from './types';

@Injectable()
export class LogsService {
  constructor(private readonly prisma: PrismaService) {}

  public async getLogs(user: UserRes): Promise<GetLogsProps[]> {
    if (user.role === 'SUPERADMIN') {
      return this.getSuperAdminLogs(user.organization_id, user.id);
    }
    if (user.role === 'ADMIN') return this.getAdminLogs(user.id);
    if (user.role === 'DOCTOR') return this.getDoctorLogs(user.id);
    if (user.role === 'MASTER') return this.getMasterLogs();

    return [];
  }

  private async getMasterLogs() {
    return await this.prisma.logs.findMany({
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
    });
  }

  private async getDoctorLogs(user_id: string) {
    return await this.prisma.logs.findMany({
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
    });
  }

  private async getAdminLogs(user_id: string) {
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

    return await this.prisma.logs.findMany({
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
    });
  }

  private async getSuperAdminLogs(
    organization_id: string,
    current_user_id: string,
  ) {
    return await this.prisma.logs.findMany({
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
    });
  }
}
