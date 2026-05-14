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
import { Role } from '@prisma/client';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) { }

  public async getChatRooms(user: UserRes, branchId: string): Promise<GetRoomsProps[]> {
    // 1) Fetch all rooms for the user (excluding appointment rooms)
    const allowedUserIds = await this.getAllowedChatUserIds(user, branchId);

    const rooms = await this.prisma.room.findMany({
      where: {
        appointment_id: null,
        AND: [
          {
            users: {
              some: {
                id: user.id,
              },
            },
          },
          {
            users: {
              some: {
                id: {
                  in: allowedUserIds,
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        users: {
          where: { id: { not: user.id } },
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
        const aTime = a.last_message_at
          ? new Date(a.last_message_at).getTime()
          : 0;
        const bTime = b.last_message_at
          ? new Date(b.last_message_at).getTime()
          : 0;

        //  newest activity first
        if (bTime !== aTime) {
          return bTime - aTime;
        }

        //  if same activity time, then unread count
        return (b.unread_count ?? 0) - (a.unread_count ?? 0);
      });
    // .sort((a, b) => {
    //   const unreadDelta = (b.unread_count ?? 0) - (a.unread_count ?? 0);
    //   if (unreadDelta !== 0) return unreadDelta;
    //   const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
    //   const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
    //   return bTime - aTime;
    // });

    console.log('enriched latest on top>>>>>>>>> ', enriched);

    return enriched as unknown as GetRoomsProps[];
  }
  // public async getChatRooms(user: UserRes): Promise<GetRoomsProps[]> {
  //   // 1) Fetch all rooms for the user (excluding appointment rooms)
  //   const rooms = await this.prisma.room.findMany({
  //     where: {
  //       AND: [
  //         {
  //           users: {
  //             some: {
  //               id: user.id,
  //             },
  //           },
  //         },
  //         {
  //           appointment_id: null,
  //         },
  //       ],
  //     },
  //     select: {
  //       id: true,
  //       users: {
  //         where: {
  //           id: {
  //             not: user.id,
  //           },
  //         },
  //         select: {
  //           first_name: true,
  //           last_name: true,
  //           middle_name: true,
  //           id: true,
  //           uri: true,
  //           email: true,
  //           role: true,
  //         },
  //       },
  //     },
  //   });

  //   if (rooms.length === 0) {
  //     return rooms as unknown as GetRoomsProps[];
  //   }

  //   const roomIds = rooms.map(r => r.id);

  //   // 2) Compute unread counts per room for this user
  //   const unreadCounts = await this.prisma.chat.groupBy({
  //     by: ['room_id'],
  //     where: {
  //       room_id: { in: roomIds },
  //       read: false,
  //       // Unread means messages authored by other users
  //       user_id: { not: user.id },
  //     },
  //     _count: { _all: true },
  //   });
  //   const unreadCountMap = new Map<string, number>(
  //     unreadCounts.map(u => [u.room_id as unknown as string, u._count._all])
  //   );

  //   // 3) Get latest message timestamp per room to use as tiebreaker sort
  //   const latestPerRoom = await this.prisma.chat.groupBy({
  //     by: ['room_id'],
  //     where: { room_id: { in: roomIds } },
  //     _max: { created_at: true },
  //   });
  //   const lastMessageAtMap = new Map<string, Date | null>(
  //     latestPerRoom.map(x => [x.room_id as unknown as string, x._max.created_at ?? null])
  //   );

  //   // 4) Merge metadata and sort: unread first, then newest activity
  //   const enriched = rooms
  //     .map(r => ({
  //       ...r,
  //       unread_count: unreadCountMap.get(r.id) ?? 0,
  //       last_message_at: lastMessageAtMap.get(r.id) ?? null,
  //     }))
  //     .sort((a, b) => {
  //       const unreadDelta = (b.unread_count ?? 0) - (a.unread_count ?? 0);
  //       if (unreadDelta !== 0) return unreadDelta;
  //       const aTime = a.last_message_at ? new Date(a.last_message_at).getTime() : 0;
  //       const bTime = b.last_message_at ? new Date(b.last_message_at).getTime() : 0;
  //       return bTime - aTime;
  //     });

  //   console.log('enriched latest on top>>>>>>>>> ', enriched);

  //   return enriched as unknown as GetRoomsProps[];
  // }

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

  // public async searchRooms(
  //   search: string,
  //   user: UserRes,
  //   branchId: string,
  // ): Promise<SearchUsersProps[]> {

  //   const allowedUserIds = await this.getAllowedChatUserIds(user, branchId);
  //   console.log('allowedUserIds>>>>', allowedUserIds);
  //   return await this.prisma.user.findMany({
  //     where: {
  //       id: {
  //         in: allowedUserIds,
  //         not: user.id,
  //       },
  //       associated_branches: {
  //         some: { id: branchId },
  //       },
  //       OR: [
  //         { first_name: { contains: search, mode: 'insensitive' } },
  //         { last_name: { contains: search, mode: 'insensitive' } },
  //         { middle_name: { contains: search, mode: 'insensitive' } },
  //         { email: { contains: search, mode: 'insensitive' } },
  //         { username: { contains: search, mode: 'insensitive' } },
  //       ],
  //     },

  //     // where: {
  //     //   AND: [
  //     //     {
  //     //       id: { in: allowedUserIds }, // 🔒 role-based security
  //     //     },
  //     //     {
  //     //       associated_branches: {
  //     //         some: { id: branchId },
  //     //       },
  //     //     },
  //     //     {
  //     //       OR: [
  //     //         { first_name: { contains: search, mode: 'insensitive' } },
  //     //         { last_name: { contains: search, mode: 'insensitive' } },
  //     //         { middle_name: { contains: search, mode: 'insensitive' } },
  //     //         { email: { contains: search, mode: 'insensitive' } },
  //     //         { username: { contains: search, mode: 'insensitive' } },
  //     //       ],
  //     //     },
  //     //     {
  //     //       NOT: { id: user.id },
  //     //     },
  //     //   ],
  //     // },


  //     select: {
  //       first_name: true,
  //       last_name: true,
  //       middle_name: true,
  //       id: true,
  //       uri: true,
  //       email: true,
  //       role: true,
  //     },
  //   });
  // }

  public async searchRooms(
    search: string,
    user: UserRes,
    branchId?: string,
  ): Promise<SearchUsersProps[]> {
    console.log('searchRooms called with search:', search, 'user:', user, 'branchId:', branchId);
    if (!search?.trim()) return [];

    search = search.trim();

    const allowedUserIds = await this.getAllowedChatUserIds(user, branchId);
    console.log('allowedUserIds>>>>', allowedUserIds);
    const branchCondition =
      user.role === Role.SUPERADMIN
        ? {}
        : {
          associated_branches: {
            some: { id: branchId },
          },
        };

    return this.prisma.user.findMany({
      where: {
        id: {
          in: allowedUserIds,
          not: user.id,
        },
        ...branchCondition,
        OR: [
          { first_name: { contains: search, mode: 'insensitive' } },
          { last_name: { contains: search, mode: 'insensitive' } },
          { middle_name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        middle_name: true,
        uri: true,
        email: true,
        role: true,
      },
    });
  }



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
    console.log(room, "roommmmmmmmmm")
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


  private async getAllowedChatUserIds(user: UserRes, branchId: string): Promise<string[]> {
    // const branchIds = user.associated_branches.map(b => b.id);

    switch (user.role) {

      /* ===================== PATIENT ===================== */
      case Role.PATIENT: {
        // Doctors assigned to patient
        const doctors = await this.prisma.doctor.findMany({
          where: {
            patients: {
              some: { user_id: user.id },
            },
          },
          select: { user_id: true },
        });
        console.log(doctors, "doctors assigned to patient")
        // Branch nurses
        const nurses = await this.prisma.nurse.findMany({
          where: {
            patients: {
              some: { user_id: user.id },
            },
          },
          select: { user_id: true },
        });

        const admins = await this.prisma.user.findMany({
          where: {
            role: Role.ADMIN,
            associated_branches: { some: { id: branchId } },
          },
          select: { id: true },
        });


        return [...doctors.map(d => d.user_id), ...nurses.map(n => n.user_id), ...admins.map(a => a.id)];
      }

      /* ===================== DOCTOR ===================== */
      case Role.DOCTOR: {
        const doctor = await this.prisma.doctor.findUnique({
          where: { user_id: user.id },
          select: {
            patients: {
              select: { user_id: true },
            },
          },
        });

        const patientIds = doctor?.patients.map(p => p.user_id) ?? [];

        // Nurses + branch admin
        const branchUsers = await this.prisma.user.findMany({
          where: {
            associated_branches: { some: { id: branchId } },
            role: { in: [Role.NURSE, Role.ADMIN, Role.DOCTOR,] },
          },
          select: { id: true },
        });

        return [...patientIds, ...branchUsers.map(u => u.id)];
      }

      /* ===================== NURSE & ADMIN ===================== */
      case Role.NURSE: {
        const nurse = await this.prisma.nurse.findUnique({
          where: { user_id: user.id },
          select: {
            patients: {
              select: { user_id: true },
            },
          },
        });

        const patientIds = nurse?.patients.map(p => p.user_id) ?? [];

        // Nurses + branch admin
        const branchUsers = await this.prisma.user.findMany({
          where: {
            associated_branches: { some: { id: branchId } },
            role: { in: [Role.NURSE, Role.ADMIN, Role.DOCTOR] },
          },
          select: { id: true },
        });

        return [...patientIds, ...branchUsers.map(u => u.id)];
      }
      case Role.ADMIN: {
        const users = await this.prisma.user.findMany({
          where: {
            OR: [
              // 🔹 All users in the same branch
              {
                associated_branches: {
                  some: { id: branchId },
                },
              },
              // 🔹 SuperAdmin (no branch)
              {
                role: Role.SUPERADMIN,
              },
            ],
          },
          select: { id: true },
        });

        return users.map(u => u.id);
      }
      case Role.SUPERADMIN: {
        const users = await this.prisma.user.findMany({
          select: { id: true },
        });

        return users.map(u => u.id);
      }
    }
  }
}
