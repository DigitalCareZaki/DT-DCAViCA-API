import { Injectable } from '@nestjs/common';
import { UserRes } from '@types';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  public async getNotifications(user: UserRes) {
    return this.prisma.notification.findMany({
      where: {
        reciever_id: user.id,
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
        title: true,
        description: true,
        sender_id: true,
        reciever_id: true,
        created_at: true,
      },
    });
  }
}
