import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';

@Controller('web/notifications')
export class NotificationsWebController extends NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {
    super(notificationService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/')
  public async getNotifications(@GetUser() user: UserRes) {
    return this.getNotificationsService().getNotifications(user);
  }
}
