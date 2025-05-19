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
import { NursePatientGuard } from 'src/auth/guards';

import { NurseController } from './nurse.controller';
import { NurseService } from './nurse.service';
import { ContactDTO } from 'src/common/dto';

import type { UserRes, JsonRes } from '@types';
import {
  PatientContact,
  PatientContacts,
  PatientDoctors,
  PatientNurses,
  PatientProfile,
  NurseStats,
} from './types';
import { LinkNurseDTO } from 'src/common/dto/linkNurse.dto';
import { GetNurses } from 'src/doctor/types';

@Controller('web/nurse')
export class NurseWebController extends NurseController {
  constructor(nurseService: NurseService) {
    super(nurseService);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  public health(): string {
    return 'Running';
  }

  @HttpCode(HttpStatus.OK)
  @Get('/')
  public async getNurses(@Query('search') search: string): Promise<any> {
    return this.getNurseService().getNurses(search);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/profile/:id') // :id -> patient -> user_id
  public async patientProfile(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<PatientProfile> {
    return this.getNurseService().patientProfile(id, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/contacts/:id') // :id -> patient -> user_id
  public async contacts(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<PatientContacts> {
    return this.getNurseService().patientsContacts(id, user.id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/patients/contacts/:id') // :id -> patient -> user_id
  @UseGuards(NursePatientGuard)
  public async createContacts(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Body() data: ContactDTO,
  ): Promise<PatientContact> {
    return this.getNurseService().createContact(id, user.id, data);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/patients/contacts/:id') // :id -> contact_id
  public async deleteContact(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<JsonRes> {
    return this.getNurseService().deleteContact(id, user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/doctors/:id') // :id -> patient -> user_id
  public async getPatientDoctors(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('search') search: string,
  ): Promise<PatientDoctors[]> {
    return this.getNurseService().getPatientDoctors(id, user.id, search || '');
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/nurses/:id') // :id -> patient -> user_id
  public async getPatientsNurses(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('search') search: string,
  ): Promise<PatientNurses[]> {
    return this.getNurseService().getPatientsNurses(id, user.id, search || '');
  }

  @HttpCode(HttpStatus.OK)
  @Get('/stats')
  public async getNurseStats(@GetUser() user: UserRes): Promise<NurseStats> {
    return this.getNurseService().getStats(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/speciality')
  public async getSpecialityList() {
    return this.getNurseService().getSpecialityList();
  }

  @HttpCode(HttpStatus.CREATED)
  @Patch('/nurses')
  public async addPatientNurse(@Body() data: LinkNurseDTO): Promise<GetNurses> {
    return this.getNurseService().addPatientNurse(
      data.nurse_id,
      data.patient_id,
    );
  }
}
