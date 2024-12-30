import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { NotificationsService } from './notifications.service';

@Controller()
@UseGuards(JwtGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  public getNotificationsService(): NotificationsService {
    return this.notificationsService;
  }
}
