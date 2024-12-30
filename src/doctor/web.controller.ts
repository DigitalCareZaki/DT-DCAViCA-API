import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from 'src/auth/decorators';

import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

import { ContactDTO } from 'src/common/dto';

import type { UserRes, JsonRes } from '@types';
import {
  PatientContact,
  PatientContacts,
  PatientDoctors,
  PatientNurses,
  PatientProfile,
  GetNurses,
  OrganizationMedication,
} from './types';

import { DoctorPatientGuard } from 'src/auth/guards';
import { LinkNurseDTO } from 'src/common/dto/linkNurse.dto';

@Controller('web/doctor')
export class DoctorWebController extends DoctorController {
  constructor(doctorService: DoctorService) {
    super(doctorService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/health')
  public health(): string {
    return 'Running';
  }

  @HttpCode(HttpStatus.OK)
  @Get('/nurses')
  public async getNurse(@Query('search') search: string): Promise<GetNurses[]> {
    return this.getDoctorService().getNurses(search);
  }

  @HttpCode(HttpStatus.CREATED)
  @Patch('/nurses')
  public async addPatientNurse(@Body() data: LinkNurseDTO): Promise<GetNurses> {
    return this.getDoctorService().addPatientNurse(
      data.patient_id,
      data.nurse_id,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/organization/medications')
  public async getOrganizationMedication(
    @GetUser() user: UserRes,
    @Query('search') search: string,
  ): Promise<OrganizationMedication[]> {
    return this.getDoctorService().getOrganizationMedication(user.id, search);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/profile/:id') // :id -> patient -> user_id
  public async patientProfile(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<PatientProfile> {
    return this.getDoctorService().patientProfile(id, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/contacts/:id') // :id -> patient -> user_id
  public async contacts(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('search') search: string,
  ): Promise<PatientContacts> {
    return this.getDoctorService().patientsContacts(id, user.id, search || '');
  }

  // TODO UseGuards(DoctorPatientGuard)
  // TODO Test if adding GetUser will add it to context
  @HttpCode(HttpStatus.CREATED)
  @Post('/patients/contacts/:id') // :id -> patient -> user_id
  public async createContacts(
    @Param('id') id: string,
    @Body() data: ContactDTO,
  ): Promise<PatientContact> {
    return this.getDoctorService().createContact(id, data);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/patients/contacts/:id') // :id -> contact_id
  @UseGuards(DoctorPatientGuard)
  public async deleteContact(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<JsonRes> {
    return this.getDoctorService().deleteContact(id, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/doctors/:id') // :id -> patient -> user_id
  public async getPatientDoctors(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('search') search: string,
  ): Promise<PatientDoctors[]> {
    return this.getDoctorService().getPatientDoctors(id, user.id, search || '');
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/nurses/:id') // :id -> patient -> user_id
  public async getPatientsNurses(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('search') search: string,
  ): Promise<PatientNurses[]> {
    return this.getDoctorService().getPatientsNurses(id, user.id, search || '');
  }
}
