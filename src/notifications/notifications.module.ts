import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsWebController } from './web.controller';
import { AdminService } from 'src/admin/admin.service';

@Module({
  providers: [NotificationsService, AdminService],
  controllers: [NotificationsWebController,],
})
export class NotificationsModule { }
