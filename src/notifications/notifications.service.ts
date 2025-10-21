import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { Role } from 'src/auth/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) { }


  public async getNotifications(
    user: UserRes,
    branchId: string,
    page: number,
    limit: number
  ) {
    const skip = (page - 1) * limit;

    let whereCondition: any = {};

    // 👇 Role-based logic using switch
    switch (user.role) {
      case Role.MASTER:
        whereCondition = {};
        break;
      case Role.SUPERADMIN:
        whereCondition = {};
        break;
      case Role.ADMIN:
        whereCondition = {
          OR: [
            {
              sender: {
                associated_branches: {
                  some: { id: branchId },
                },
              },
            },
            {
              reciever: {
                associated_branches: {
                  some: { id: branchId },
                },
              },
            },
          ],
        };
        break;
      case Role.DOCTOR:
      case Role.PATIENT:
      case Role.NURSE:
        // Branch-level users — branch-specific notifications
        whereCondition = {
          reciever_id: user.id
        };
        break;

      default:
        // Default fallback — personal notifications only
        whereCondition = { reciever_id: user.id };
        break;
    }

    // Fetch notifications and total count in a transaction
    const [notifications, totalItems] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        skip,
        take: limit,
        where: whereCondition,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          title: true,
          description: true,
          sender_id: true,
          reciever_id: true,
          created_at: true,
          sender: {
            select: {
              first_name: true,
              middle_name: true,
              last_name: true,
              uri: true,
              email: true,
              role: true,
            },
          },
          reciever: {
            select: {
              first_name: true,
              middle_name: true,
              last_name: true,
              uri: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.notification.count({ where: whereCondition }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data: notifications,
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

  public async getPatientNotifications(patientId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [notifications, totalItems] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        skip,
        take: limit,
        where: {
          reciever_id: patientId,
        },
        orderBy: {
          created_at: 'desc',
        },

        select: {
          id: true,
          sender: {
            select: {
              first_name: true,
              last_name: true,
              middle_name: true,
              uri: true,
              email: true,
              role: true,
            },
          },
          reciever: {
            select: {
              first_name: true,
              last_name: true,
              middle_name: true,
              uri: true,
              email: true,
              role: true,
            },
          },

          title: true,
          description: true,
          sender_id: true,
          reciever_id: true,
          created_at: true,
        },
      }),
      this.prisma.notification.count({
        where: {
          reciever_id: patientId,
        },
      }),
    ]);
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;
    return {
      data: notifications,
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
