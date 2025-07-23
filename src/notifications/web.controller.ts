import { Body, Controller, Get, HttpCode, HttpStatus, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { JwtGuard } from 'src/auth/guards';

@Controller('web/notifications')
export class NotificationsWebController {
  constructor(private readonly notificationService: NotificationsService) { }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard)
  @Get('/')
  public async getNotifications(@Query('page') page = 1, @Query('limit') limit = 10, @GetUser() user: UserRes) {
    return this.notificationService.getNotifications(user, +page, +limit);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:patient_id')
  public async fetchPatientNotifications(@Param('patient_id') patient_id: string) {
    return this.notificationService.getPatientNotifications(patient_id);
  }
}
