import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  private chats = new Map<string, any>();

  constructor(private prisma: PrismaService) { }

  public async incomingMessage(payload: any) {
    const roomChats = this.chats.get(payload.room_id) ?? [];
    console.log('roomChats>>>>>>>>>>>>> ', roomChats);
    console.log('payload >>>>>>>>>> ', payload);

    roomChats.push({
      ...payload,
      created_at: new Date().getTime(),
    });

    const chat = await this.prisma.chat.create({
      data: {
        room_id: payload.room_id,
        user_id: payload.author_id,
        message: payload.message,
        created_at: new Date(),
      },
    });

    console.log('chat >>>>>>> ', chat);

    this.chats.set(payload.room_id, roomChats);
    return roomChats;
  }

  public getRoomChats(roomId: string) {
    return this.chats.get(roomId) ?? [];
  }
}
