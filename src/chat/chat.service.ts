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
  constructor(private prisma: PrismaService) { }

  public async getChatRooms(user: UserRes): Promise<GetRoomsProps[]> {
    // 1) Fetch all rooms for the user (excluding appointment rooms)
    const rooms = await this.prisma.room.findMany({
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

    if (rooms.length === 0) {
      return rooms as unknown as GetRoomsProps[];
    }

    const roomIds = rooms.map(r => r.id);

    // 2) Compute unread counts per room for this user
    const unreadCounts = await this.prisma.chat.groupBy({
      by: ['room_id'],
      where: {
        room_id: { in: roomIds },
        read: false,
        // Unread means messages authored by other users
        user_id: { not: user.id },
      },
      _count: { _all: true },
    });
    const unreadCountMap = new Map<string, number>(
      unreadCounts.map(u => [u.room_id as unknown as string, u._count._all])
    );

    // 3) Get latest message timestamp per room to use as tiebreaker sort
    const latestPerRoom = await this.prisma.chat.groupBy({
      by: ['room_id'],
      where: { room_id: { in: roomIds } },
      _max: { created_at: true },
    });
    const lastMessageAtMap = new Map<string, Date | null>(
      latestPerRoom.map(x => [x.room_id as unknown as string, x._max.created_at ?? null])
    );

    // 4) Merge metadata and sort: unread first, then newest activity
    const enriched = rooms
      .map(r => ({
        ...r,
        unread_count: unreadCountMap.get(r.id) ?? 0,
        last_message_at: lastMessageAtMap.get(r.id) ?? null,
      }))
      .sort((a, b) => {
        const unreadDelta = (b.unread_count ?? 0) - (a.unread_count ?? 0);
        if (unreadDelta !== 0) return unreadDelta;
        const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return bTime - aTime;
      });

    console.log('enriched latest on top>>>>>>>>> ', enriched);

    return enriched as unknown as GetRoomsProps[];
  }

  public async markRoomRead(user: UserRes, roomId: string): Promise<{ updated: number; }> {
    const result = await this.prisma.chat.updateMany({
      where: {
        room_id: roomId,
        read: false,
        user_id: { not: user.id },
      },
      data: {
        read: true,
      },
    });

    return { updated: result.count };
  }

  public async ceateRoom(
    user: UserRes,
    data: RoomDTO,
  ): Promise<CreateRoomProps> {
    const res = await this.isRoomExisted(user.id, data.user_id);

    console.log('res >>>>>>>>> ', res);

    if (res) {
      return res;
    }

    const result = await this.prisma.room.create({
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

    console.log('result >>>>>>>>> ', result);

    return result;
  }

  public async searchRooms(
    search: string,
    userId: string,
    branchId: string,
  ): Promise<SearchUsersProps[]> {
    return await this.prisma.user.findMany({
      where: {
        AND: [
          {
            associated_branches: {
              some: {
                id: branchId,  // 🔥 Only users from this branch
              },
            },
          },
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

  // public async getRoomChats(roomId: string) {
  //   console.log('roomId: ', roomId);
  //   return await this.prisma.room.findUnique({
  //     where: {
  //       id: roomId,
  //     },

  //     select: {
  //       chats: {
  //         select: {
  //           id: true,
  //           message: true,
  //           media: true,
  //           read: true,
  //           user_id: true,
  //           created_at: true,
  //           auhor: {
  //             select: {
  //               first_name: true,
  //               last_name: true,
  //               middle_name: true,
  //               uri: true,
  //               role: true,
  //               id: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });
  // }
  public async getRoomChats(roomId: string) {
    console.log('roomId: ', roomId);

    const room = await this.prisma.room.findUnique({
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

    const modifiedChats = room?.chats.map(chat => ({
      id: chat.id,
      message: chat.message,
      media: chat.media,
      read: chat.read,
      author_id: chat.user_id,
      created_at: chat.created_at,
      author: chat.auhor,
    })) ?? [];

    return {
      chats: modifiedChats,
    };
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
