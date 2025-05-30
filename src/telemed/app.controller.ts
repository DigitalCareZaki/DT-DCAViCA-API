import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TelemedService } from './telemed.service';
import { TelemedCreateDTO } from './dto';
import { GetUser } from 'src/auth/decorators';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

import { RolesGuard } from 'src/auth/guards';
import { TelemedAssignPatientDTO } from './dto/assignPatientTelemed.dto';

import type {
  Appointment as AppointmentType,
  GetAppointmentsType,
  SearchResProps,
  RequestedAppointmentProps,
  TelemedViewProps,
  MeetingMetadataProps,
  JoinedMeetingProps,
  GetMeetingParticipantsProps,
  LeftMeetingProps,
  GetMeetingChatsProps,
  SlotParent,
  AppointmentReport,
} from './types';
import type { UserRes } from '@types';
import { TelemedActionDTO } from './dto/action.dto';
import { JwtGuard } from 'src/auth/guards';

@Controller('app/telemed')
@UseGuards(JwtGuard)
export class TelemedAppController {
  constructor(private readonly telemedService: TelemedService) { }

  @Get('/appointments')
  public async getAppointments(
    @GetUser() user: UserRes,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const appointments = await this.telemedService.appointmentAnalytics(
      user,
      page ? +page : 1,
      limit ? +limit : 10,
    );

    const analytics = await this.telemedService.appointmentAnalyticsGroup(user);

    return {
      analytics,
      list: appointments.data,
    };
  }

}
