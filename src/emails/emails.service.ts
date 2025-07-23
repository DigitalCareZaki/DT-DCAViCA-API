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

  public async getEmailHistory(user: UserRes, page: number, limit: number) {
    if (user.role === 'SUPERADMIN') return this.getSuperAdminEmailHistory(user, page, limit);
    if (user.role === 'ADMIN') return this.getAdminEmailHistory(user, page, limit);
    if (user.role === 'MASTER') return this.getMasterEmailHistory(page, limit);
  }

  private async getAdminEmailHistory(user: UserRes, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const branch = await this.prisma.user.findUnique({
      where: {
        id: user.id,
      },
      select: {
        associated_branches: true,
      },
    });
    const [emails, totalItems] = await this.prisma.$transaction([
      this.prisma.emails.findMany({
        skip,
        take: limit,
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
      }),
      this.prisma.emails.count({
        where: {
          user: {
            associated_branches: {
              some: {
                id: branch.associated_branches[0]?.id,
              },
            },
          },
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: emails,
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

  private async getMasterEmailHistory(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [emails, totalItems] = await this.prisma.$transaction([
      this.prisma.emails.findMany({
        skip,
        take: limit,
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
      }),
      this.prisma.emails.count({}),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
      data: emails,
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

  private async getSuperAdminEmailHistory(user: UserRes, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [emails, totalItems] = await this.prisma.$transaction([
      this.prisma.emails.findMany({
        skip,
        take: limit,
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

      }),
      this.prisma.emails.count({
        where: {
          user: {
            organization_id: user.organization_id,
          },
        },
      }),

    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
      data: emails,
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

  public async getUserEmailHistory(userId: string) {
    return await this.prisma.emails.findMany({
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
    })

  }
}