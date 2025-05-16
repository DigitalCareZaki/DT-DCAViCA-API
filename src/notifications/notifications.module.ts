import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsWebController } from './web.controller';

@Module({
  providers: [NotificationsService],
  controllers: [NotificationsWebController],
})
export class NotificationsModule { }
