import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Body,
} from '@nestjs/common';

import { PatientController } from './patient.controller';
import { PatientService } from './patient.service';

import { GetUser } from 'src/auth/decorators';

import { PatientMedicationAlertDTO } from './dto';

import type { UserRes } from '@types';
import type { PatientMedicationAlert } from './types';

@Controller('web/patient')
export class PatientWebController extends PatientController {
  constructor(patientService: PatientService) {
    super(patientService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/medications/alerts')
  public async getPatientMedicationAlertsForToday(
    @GetUser() user: UserRes,
  ): Promise<PatientMedicationAlert[]> {
    return this.getPatientService().getAllPatientMedicationAlertsForToday(
      user.id,
    );
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
}
