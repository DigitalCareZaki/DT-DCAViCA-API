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
import { TelemedController } from './telemed.controller';
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

@Controller('web/telemed')
export class TelemedWebController extends TelemedController {
  constructor(telemedService: TelemedService) {
    super(telemedService);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async getTelemed(
    @GetUser() user: UserRes,
  ): Promise<GetAppointmentsType[]> {
    return this.getTelemedService().getAppointments(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch()
  @UseGuards(RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
  public async assignParticipientPatient(@Body() dto: TelemedAssignPatientDTO) {
    return this.getTelemedService().assignParticipientPatient(
      dto.user_id,
      dto.appointment_id,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseGuards(RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
  public async createTelemed(
    @Body() data: TelemedCreateDTO,
    @GetUser() user: UserRes,
  ): Promise<AppointmentType> {
    return this.getTelemedService().createAppointment(user, data);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/search')
  public async searchTelemed(
    @Query('q') search: string,
    @GetUser() user: UserRes,
  ): Promise<SearchResProps[]> {
    return this.getTelemedService().searchTelemed(search, user.id);
  }


  @HttpCode(HttpStatus.OK)
  @Get('/requested')
  public async requested(
    @GetUser() user: UserRes,
  ): Promise<RequestedAppointmentProps[]> {
    return this.getTelemedService().requested(user);
  }
  @HttpCode(HttpStatus.OK)
  @Get('/patientappointments')
  public async patientAppointments(
    @Query('patientId') patientId?: string,

  ): Promise<RequestedAppointmentProps[]> {
    return this.getTelemedService().patientAppointments(patientId);
  }
  @HttpCode(HttpStatus.OK)
  @Get('/appointmentanalytics')
  public async appointmentAnalytics(
    @GetUser() user: UserRes,
  ): Promise<RequestedAppointmentProps[]> {
    return this.getTelemedService().appointmentAnalytics(user);
  }
  @HttpCode(HttpStatus.OK)
  @Get('/todayappointments')
  public async todayappointments(
    @GetUser() user: UserRes,
  ) {
    return this.getTelemedService().todayappointments(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/calendar')
  public async calendar(
    @GetUser() user: UserRes, // Authenticated user
    @Query('userId') userId?: string, // Optional userId query parameter
  ): Promise<SlotParent> {
    const calendarUserId = userId || user.id; // Use the provided userId or fallback to authenticated user
    // console.log(`Fetching calendar for user: ${calendarUserId}`);

    return this.getTelemedService().calendar(calendarUserId);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/calendar')
  public async updateCalendar(
    @GetUser() user: UserRes,
    @Body() data: SlotParent, // Accepting SlotParent as input data
  ): Promise<SlotParent> {
    // console.log(`Updating calendar for user: ${user.id}`);
    // console.log('Data: ', data);
    return this.getTelemedService().updateCalendar(user, data);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/report')
  public async createReport(
    @GetUser() user: UserRes,
    @Body() data: AppointmentReport, // Accepting SlotParent as input data
  ): Promise<AppointmentReport> {

    return this.getTelemedService().createReport(user, data);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/action')
  public async updateStatus(
    @GetUser() user: UserRes,
    @Body() data: TelemedActionDTO,
  ) {
    return this.getTelemedService().action(user, data);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/view/:id')
  public async getView(
    @Param('id') id: string,
    // @GetUser() user: UserRes,
  ): Promise<TelemedViewProps> {
    return this.getTelemedService().details(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/validate-meeting/:id')
  public async validateMeeting(
    @Param('id') id: string,
    @GetUser() user: UserRes,
  ) {
    return await this.getTelemedService().validateMeeting(id, user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/meeting-metadata/:id')
  public async meetingMetadata(
    @Param('id') id: string,
  ): Promise<MeetingMetadataProps> {
    return await this.getTelemedService().getMeetingMetaData(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/join-meeting/:id')
  public async joinedMeeting(
    @Param('id') id: string,
    @GetUser() user: UserRes,
  ): Promise<JoinedMeetingProps> {
    return await this.getTelemedService().joinedMeeting(id, user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/meeting-participants/:id')
  public async meetingParticipants(
    @Param('id') id: string,
  ): Promise<GetMeetingParticipantsProps[]> {
    return await this.getTelemedService().getMeetingParticipants(id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/left-meeting/:id')
  public async leftMeeting(
    @Param('id') id: string,
    @GetUser() user: UserRes,
  ): Promise<LeftMeetingProps> {
    return await this.getTelemedService().leftMeeting(id, user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/meeting-discussion/:id')
  public async getMeetingDiscussion(
    @Param('id') id: string,
    @GetUser() user: UserRes,
  ): Promise<GetMeetingChatsProps> {
    return await this.getTelemedService().getMeetingDiscussion(id, user);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/meeting-update-status/:id')
  public async updateMeetingStatus(
    @Param('id') id: string,
    @GetUser() user: UserRes,
    @Body() data: { status: string },
  ): Promise<boolean> {
    return await this.getTelemedService().updateMeetingStatus(
      id,
      user.id,
      data.status,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patient/recent-measurement/:id')
  public async recentMeasurement(@Param('id') telemed_id: string) {
    const patient =
      await this.getTelemedService().getTelemedPatient(telemed_id);

    return this.getTelemedService().gePatientRecentMeasurement(patient);
  }
}
