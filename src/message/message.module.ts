import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageWebController } from './web.controller';
import { MessageAppController } from './app.controller';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [SocketModule],
  controllers: [MessageWebController, MessageAppController],
  providers: [MessageService],
  exports: [MessageService],
})
export class MessageModule { }
