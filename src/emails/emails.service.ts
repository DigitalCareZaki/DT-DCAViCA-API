import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EmailsService {
  constructor(private readonly prisma: PrismaService) { }

  public async getEmailTemplate(user: UserRes) {
    if (user.role === 'SUPERADMIN')
      return this.getSuperAdminEmailTemplate(user);
  }

  private async getSuperAdminEmailTemplate(user: UserRes) {
    return [user];
  }

  public async getEmailHistory(user: UserRes) {
    if (user.role === 'SUPERADMIN') return this.getSuperAdminEmailHistory(user);
    if (user.role === 'ADMIN') return this.getAdminEmailHistory(user);
    if (user.role === 'MASTER') return this.getMasterEmailHistory();
  }

  private async getAdminEmailHistory(user: UserRes) {
    const branch = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        associated_branches: true,
      },
    });

    return this.prisma.emails.findMany({
      where: {
        user: {
          associated_branches: {
            some: {
              id: branch.associated_branches[0]?.id,
            },
          },
        },
      },

      select: {
        id: true,
        error: true,
        sended: true,
        subject: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            email: true,
          },
        },
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  private async getMasterEmailHistory() {
    return this.prisma.emails.findMany({
      select: {
        id: true,
        error: true,
        sended: true,
        subject: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            email: true,
          },
        },
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  private async getSuperAdminEmailHistory(user: UserRes) {
    return this.prisma.emails.findMany({
      where: {
        user: {
          organization_id: user.organization_id,
        },
      },

      select: {
        id: true,
        error: true,
        sended: true,
        subject: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            email: true,
          },
        },
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  public async getUserEmailHistory(userId: string) {
    return this.prisma.emails.findMany({
      where: {
        user: {
          id: userId,
        },
      },

      select: {
        id: true,
        error: true,
        sended: true,
        subject: true,
        html: true,
        user: {
          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            uri: true,
            email: true,
          },
        },
        created_at: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }
}
