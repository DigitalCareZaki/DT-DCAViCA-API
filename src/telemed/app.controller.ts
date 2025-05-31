import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TelemedService } from './telemed.service';
import { GetUser } from 'src/auth/decorators';
import type { UserRes } from '@types';
import { JwtGuard } from 'src/auth/guards';

@Controller('app/telemed')
@UseGuards(JwtGuard)
export class TelemedAppController {
  constructor(private readonly telemedService: TelemedService) { }

  @Get('/appointments')
  public async getAppointments(@GetUser() user: UserRes, @Query('page') page?: number, @Query('limit') limit?: number) {
    const appointments = await this.telemedService.appointmentAnalytics(user, page ? +page : 1, limit ? +limit : 10);
    const analytics = await this.telemedService.appointmentAnalyticsGroup(user);

    return {
      analytics,
      list: appointments.data,
    };
  }
}
