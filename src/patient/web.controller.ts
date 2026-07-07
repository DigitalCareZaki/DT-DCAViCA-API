import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Body,
  Query,
  Post,
} from '@nestjs/common';

import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

import { GetUser } from 'src/auth/decorators';

import { PatientMedicationAlertDTO } from './dto';
import { Role } from 'src/auth/enums/role.enum';
import type { UserRes } from '@types';
import type { AssignedCareTeam, PatientMedicationAlert } from './types';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

@Controller('web/patient')
export class PatientWebController extends PatientController {
  constructor(patientService: PatientService) {
    super(patientService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/assigned-care-team')
  @RequirePermission(Role.PATIENT)
  public async getAssignedCareTeam(
    @GetUser() user: UserRes,
  ): Promise<AssignedCareTeam> {
    return this.getPatientService().getAssignedCareTeam(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/medications/alerts')
  public async getPatientMedicationAlertsForToday(
    @GetUser() user: UserRes,
    @Query('page') page = 1,
    @Query('limit') limit = 10) {
    return this.getPatientService().getAllPatientMedicationAlertsForToday(user.id, +page, +limit);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/medications/alerts/:id') // :id -> medication -> patient_medication_alerts -> id
  public async updateMedicationAlertStatus(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Body() data: PatientMedicationAlertDTO,
  ): Promise<any> {
    return this.getPatientService().updatePatientMedicationAlertTakenStatus(
      id,
      user.id,
      data,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/contacts') // :id -> medication -> patient_medication_alerts -> id
  public async fetchContacts(@GetUser() user: any) {
    return this.getPatientService().fetchContacts(user.id);
  }
  @HttpCode(HttpStatus.OK)
  @Get('/assign-doctors/:id') // Patient ID > user.id
  public async fetchAssignedDoctors(@GetUser() user: any, @Param('id') id: string) {
    return this.getPatientService().fetchAssignedDoctors(user.id, id);
  }

  // @HttpCode(HttpStatus.OK)
  // @Post('vlLogin')
  // public async vlLogin(@GetUser() user: any) {
  //   return this.getPatientService().vlLogin(user.id);
  // }

  @HttpCode(HttpStatus.OK)
  @Get('/assign-doctors/all/:id')
  public async fetchAllAssignedDoctors(@GetUser() user: any, @Param('id') id: string) {
    return this.getPatientService().fetchAllAssignedDoctors(id);
  }


}
