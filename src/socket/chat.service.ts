import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatService {
  private chats = new Map<string, any>();

  constructor(private prisma: PrismaService) {}

  public incormingMessage(payload: any) {
    const roomChats = this.chats.get(payload.room_id) ?? [];

    roomChats.push({
      ...payload,
      created_at: new Date().getTime(),
    });

    this.chats.set(payload.room_id, roomChats);
    return roomChats;
  }

  public getRoomChats(roomId: string) {
    return this.chats.get(roomId) ?? [];
  }
}
