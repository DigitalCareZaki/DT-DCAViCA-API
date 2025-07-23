import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { Role } from 'src/auth/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) { }

  public async getNotifications(user: UserRes, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const whereCondition =
      user.role === Role.SUPERADMIN ||
        user.role === Role.ADMIN ||
        user.role === Role.MASTER
        ? {}
        : { reciever_id: user.id };

    const [notifications, totalItems] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: whereCondition,
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
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
        where: whereCondition,
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

  public async getPatientNotifications(patientId: string) {
    return this.prisma.notification.findMany({
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
    });
  }
}
