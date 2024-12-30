import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  public async createNotification(payload: any) {
    const { sender_id, message, title } = payload;
    let { reciever_id } = payload;

    if (reciever_id?.includes('@')) {
      reciever_id = (
        await this.prisma.user.findUnique({
          where: {
            email: reciever_id,
          },

          select: {
            id: true,
          },
        })
      ).id;
    }

    return await this.prisma.notification.create({
      data: {
        sender_id,
        reciever_id,
        description: message,
        title,
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
