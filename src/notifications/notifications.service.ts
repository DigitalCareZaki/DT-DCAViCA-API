import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { Role } from 'src/auth/enums/role.enum';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) { }

  public async getNotifications(user: UserRes) {
    const whereCondition = (user.role === Role.SUPERADMIN || user.role === Role.ADMIN || user.role === Role.MASTER)
      ? {} // Empty where condition to get all notifications
      : { reciever_id: user.id }; // Otherwise get only user's notifications

    return this.prisma.notification.findMany({
      where: whereCondition,

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
