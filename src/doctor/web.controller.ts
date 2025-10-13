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
  DoctorStats,
} from './types';

import { DoctorPatientGuard } from 'src/auth/guards';
import { LinkNurseDTO } from 'src/common/dto/linkNurse.dto';
import { ElectronicmedicalreportService } from 'src/electronicmedicalreport/electronicmedicalreport.service';

@Controller('web/doctor')
export class DoctorWebController extends DoctorController {
  constructor(doctorService: DoctorService, private emrService: ElectronicmedicalreportService) {
    super(doctorService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/all-reports')
  public fetchReports(@Query('page') page = 1, @Query('limit') limit = 10) {
    return this.emrService.getAllPatientReports(+page, +limit);
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
      data.nurse_id,
      data.patient_id,
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

  @HttpCode(HttpStatus.OK)
  @Get('/stats')
  public async getDoctorStats(@GetUser() user: UserRes): Promise<DoctorStats> {
    return this.getDoctorService().getStats(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/doctors')
  public async getDoctorList(@Query('search') search: string) {
    return this.getDoctorService().getDoctorList(search);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/doctors/speciality')
  public async getDoctorsBySpeciality(@Query('specialityId') specialityId: string) {
    return this.getDoctorService().getDoctorsBySpeciality(specialityId);
  }
  @HttpCode(HttpStatus.OK)
  @Get('/patientsbydoctor')
  public async getPatientsByDoctors(@GetUser() user: UserRes) {
    return this.getDoctorService().getPatientsByDoctors(user.id);
  }
  @HttpCode(HttpStatus.OK)
  @Get('/speciality')
  public async getSpecialityList() {
    return this.getDoctorService().getSpecialityList();
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/doctors')
  public async assignDoctorToPatient(@Body('doctorId') doctorId: string, @Body('patientId') patientId: string) {
    return this.getDoctorService().assignDoctorToPatient(doctorId, patientId);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/nurse/speciality')
  public async getNursesBySpeciality(@Query('specialityId') specialityId: string) {
    return this.getDoctorService().getNursesBySpeciality(specialityId);
  }


}
