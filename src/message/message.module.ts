import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageWebController } from './web.controller';
import { MessageAppController } from './app.controller';

@Module({
  controllers: [MessageWebController, MessageAppController],
  providers: [MessageService],
})
export class MessageModule {}
