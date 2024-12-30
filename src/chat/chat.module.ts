import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatWebController } from './web.controller';

@Module({
  controllers: [ChatController, ChatWebController],
  providers: [ChatService],
})
export class ChatModule {}
