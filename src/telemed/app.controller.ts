import {
  Controller,
  Get,
  Param,
  HttpStatus,
  Query,
  UseGuards
} from '@nestjs/common';
import { TelemedService } from './telemed.service';
import { GetUser } from 'src/auth/decorators';
import type { UserRes } from '@types';
import { JwtGuard } from 'src/auth/guards';
import AppError from 'src/errors/AppError';

@Controller('app/telemed')
@UseGuards(JwtGuard)
export class TelemedAppController {
  constructor(private readonly telemedService: TelemedService) { }

  @Get('/appointments')
  public async getAppointments(@GetUser() user: UserRes, @Query('page') page?: number, @Query('limit') limit?: number) {
    console.log('User:===========>>', user);
    const appointments = await this.telemedService.appointmentAnalytics(user, page ? +page : 1, limit ? +limit : 10);
    const analytics = await this.telemedService.appointmentAnalyticsGroup(user);

    return {
      analytics,
      Appointmentlist: appointments.Appointmentlist,
    };
  }

  @Get('/report/:appointmentId')
  public async getAppointmentReport(@Param('appointmentId') appointmentId: string) {
    const appointment = await this.telemedService.details(appointmentId);
    console.log(appointment, '=================>>>>');
    if (!appointment) {
      throw new AppError('Appointment not found', HttpStatus.NOT_FOUND);
    }

    if (!appointment.appointmentObservation) {
      throw new AppError('Report not found', HttpStatus.NOT_FOUND);
    }

    return appointment.appointmentObservation;
  }

}
