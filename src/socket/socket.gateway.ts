import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserRes } from '@types';
import { Socket, Server } from 'socket.io';
import { SocketService } from './socket.service';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import type { AppointmentProps, MeetingChatProps } from './types';
import { ChatService } from './chat.service';
import { NotificationService } from './notification.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly clients = new Map<string, UserRes>();
  private readonly socketService: SocketService;
  private readonly chatService: ChatService;
  private readonly notificationService: NotificationService;

  constructor(private prisma: PrismaService) {
    this.socketService = new SocketService(this.prisma);
    this.chatService = new ChatService(this.prisma);
    this.notificationService = new NotificationService(this.prisma);
  }

  @WebSocketServer() server: Server;

  afterInit() {
    console.log('Websocket gateway init');
  }

  handleConnection(client: Socket) {
    console.log('new client conencted: ', client.handshake.query?.id);
    if (client.handshake.query?.id) {
      this.clients.set(client.handshake.query.id.toString(), {
        ...(client.handshake.query as any),
      });
    }

    console.log('total clients: ', this.clients.size);
  }

  handleDisconnect(client: Socket) {
    console.log('client disconnected: ', client.handshake.query?.id?.toString());

    if (!client.handshake.query?.id) return;

    this.clients.delete(client.handshake.query?.id?.toString());

    const { key, participants } = this.socketService.onParticipantLeft(
      client.handshake.query?.id?.toString(),
    );

    this.emitTotalParticipants(participants, key);

    console.log('total clients: ', this.clients.size);
  }

  @SubscribeMessage('messageToServer')
  handleMessage(client: Socket, payload: any): void {
    console.log(`client ${client.id}: `, payload);
    this.server.emit('messageToClient: ', 'Hi');
  }

  @SubscribeMessage('appointment')
  handleMeeting(client: Socket, payload: AppointmentProps): void {
    if (!payload.appointment_id) return;

    const participants = this.socketService.onAppointmentJoin(payload);

    this.emitTotalParticipants(participants, payload.appointment_id);

    const chats = this.socketService.getMeetingChat(payload.appointment_id);
    this.emitChat(chats, payload.appointment_id);

    client.on(`${payload.appointment_id}:meeting-controlls`, (payload) => {
      // Handle the event...

      const participants = this.socketService.OnmeetingControlls(
        payload.appointment_id,
        payload?.user_id,
        {
          hand: payload.raised,
          camera: payload.camera,
          microphone: payload.microphone,
        },
      );

      this.emitTotalParticipants(participants, payload.appointment_id);
    });

    client.on(`${payload.appointment_id}:meeting-chat`, (payload) => {
      if (!payload.appointment_id || !payload.user_id) return;

      const chats = this.socketService.onMeetingChat(payload);

      this.emitChat(chats, payload.appointment_id);
    });
  }

  @SubscribeMessage('appointment_participants')
  onAppointmentParticipants(payload: any): void {
    const participants = this.socketService.onAppointmentParticipants(payload);

    if (!payload.appointment_id) return;

    this.emitTotalParticipants(participants, payload.appointment_id);
  }

  @SubscribeMessage('message')
  async handleChat(client: Socket, payload: any): Promise<void> {
    if (!payload.room_id) return;

    try {
      const chats = await this.chatService.incomingMessage(payload);

      const data = {
        [payload.room_id]: chats,
      };

      this.emitRoomChats(data, payload.room_id);
    } catch (error) {
      console.error('Error handling chat message: ', error);
    }
  }


  @SubscribeMessage('room-init')
  handleRoomInit(client: Socket, payload: any): void {
    if (!payload.room_id) return;

    const chats = this.chatService.getRoomChats(payload?.room_id);

    const data = {
      [payload.room_id]: chats,
    };

    this.emitRoomChats(data, payload.room_id);
  }

  @SubscribeMessage('send_notification')
  async handleNotification(client: Socket, payload: any) {
    if (!payload?.reciever_id) return;

    try {
      const notification = await this.notificationService.createNotification(payload);
      this.server.emit(`${notification.reciever_id}:recieve_notification`, notification);
    } catch (error) {
      console.error('Error sending notification: ', error);
    }
  }

  private emitTotalParticipants(participants: any, appointment_id: string) {
    console.log('emitting: ', `${appointment_id}:totalParticiapnts`);
    this.server.emit(`${appointment_id}:totalParticiapnts`, participants);
  }

  private emitChat(chats: MeetingChatProps[], appointment_id: string) {
    console.log('emitting: ', `${appointment_id}:meeting-chat-client`);
    this.server.emit(`${appointment_id}:meeting-chat-client`, chats);
  }

  private emitRoomChats(data: any, channelId: string) {
    this.server.emit(channelId, data);
  }
}
