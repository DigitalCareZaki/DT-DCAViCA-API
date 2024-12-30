import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsWebController } from './web.controller';

@Module({
  providers: [NotificationsService],
  controllers: [NotificationsController, NotificationsWebController],
})
export class NotificationsModule {}
