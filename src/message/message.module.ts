import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageWebController } from './web.controller';
import { MessageAppController } from './app.controller';
import { SocketModule } from 'src/socket/socket.module';
import { AdminService } from 'src/admin/admin.service';

@Module({
  imports: [SocketModule],
  controllers: [MessageWebController, MessageAppController],
  providers: [MessageService, AdminService],
  exports: [MessageService],
})
export class MessageModule { }
