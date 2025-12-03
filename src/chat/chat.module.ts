import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatWebController } from './web.controller';
import { AdminService } from 'src/admin/admin.service';

@Module({
  controllers: [ChatController, ChatWebController],
  providers: [ChatService, AdminService],
})
export class ChatModule { }
