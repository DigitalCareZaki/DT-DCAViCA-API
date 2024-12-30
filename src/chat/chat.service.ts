import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import { RoomDTO } from './dto/room.dto';

import { UserRes } from '@types';
import type {
  CreateRoomProps,
  ValidateRoomProps,
  SearchUsersProps,
  GetRoomsProps,
} from './types';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  public async getChatRooms(user: UserRes): Promise<GetRoomsProps[]> {
    return await this.prisma.room.findMany({
      where: {
        AND: [
          {
            users: {
              some: {
                id: user.id,
              },
            },
          },
          {
            appointment_id: null,
          },
        ],
      },
      select: {
        id: true,
        users: {
          where: {
            id: {
              not: user.id,
            },
          },

          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            id: true,
            uri: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  public async ceateRoom(
    user: UserRes,
    data: RoomDTO,
  ): Promise<CreateRoomProps> {
    const res = await this.isRoomExisted(user.id, data.user_id);

    if (res) {
      return res;
    }

    return await this.prisma.room.create({
      data: {
        users: {
          connect: [
            {
              id: user.id,
            },
            {
              id: data.user_id,
            },
          ],
        },
      },

      select: {
        id: true,
        users: {
          where: {
            id: {
              not: user.id,
            },
          },

          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            id: true,
            uri: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  public async searchRooms(
    search: string,
    userId: string,
  ): Promise<SearchUsersProps[]> {
    return await this.prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                first_name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                last_name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                middle_name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                email: search,
              },
              {
                username: search,
              },
            ],
          },
          {
            NOT: {
              id: userId,
            },
          },
        ],
      },

      select: {
        first_name: true,
        last_name: true,
        middle_name: true,
        id: true,
        uri: true,
        email: true,
        role: true,
      },
    });
  }

  public async getRoomChats(roomId: string) {
    console.log('roomId: ', roomId);
    return await this.prisma.room.findUnique({
      where: {
        id: roomId,
      },

      select: {
        chats: {
          select: {
            id: true,
            message: true,
            media: true,
            read: true,
            user_id: true,
            created_at: true,
            auhor: {
              select: {
                first_name: true,
                last_name: true,
                middle_name: true,
                uri: true,
                role: true,
                id: true,
              },
            },
          },
        },
      },
    });
  }

  private async isRoomExisted(
    currentUserId: string,
    participantUserId: string,
  ): Promise<ValidateRoomProps> {
    return await this.prisma.room.findFirst({
      where: {
        AND: [
          {
            users: {
              some: {
                id: currentUserId,
              },
            },
          },
          {
            users: {
              some: {
                id: participantUserId,
              },
            },
          },
          {
            appointment_id: null,
          },
        ],
      },

      select: {
        id: true,
        users: {
          where: {
            id: {
              not: currentUserId,
            },
          },

          select: {
            first_name: true,
            last_name: true,
            middle_name: true,
            id: true,
            uri: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }
}
