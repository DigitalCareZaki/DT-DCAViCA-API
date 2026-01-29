import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrganizationController } from './organization.controller';
import { OrganizationService } from './organization.service';
import { GetUser } from 'src/auth/decorators';
import { RolesGuard } from 'src/auth/guards';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

import type {
  OrganizationUsers,
  SelectOrganizationBranchesProps,
  SelectOrganizationDepartmentProps,
} from './types';
import { LocationService } from 'src/location/location.service';
import { CitiesProps, CountriesProps } from 'src/location/types';
import { PatientService } from 'src/patient/patient.service';
import { AddPatientDTO, AddNurseDTO, AddDoctoreDTO } from './dto';
import type { AddDoctorResult } from 'src/doctor/types';
import { UserRes, UserRole } from '../types/user';
import { NurseService } from 'src/nurse/nurse.service';
import { DoctorService } from 'src/doctor/doctor.service';
import { AddAdminDTO } from './dto/addAdmin.dto';
import { AdminService } from 'src/admin/admin.service';
import { AddSuperadminDTO } from './dto/addSuperadmin.dto';
import { AddMedicineDTO, AddMedicinesDTO } from './dto/addMedicines.dto';
import {
  AddSuperAdminMedicineDTO,
  AddSuperAdminMedicinesDTO,
} from './dto/addMedicinesuperadmin.dto';

@Controller('web/organization')
export class OrganizationWebController extends OrganizationController {
  constructor(
    organizationService: OrganizationService,
    locationService: LocationService,
    patientService: PatientService,
    nurseService: NurseService,
    doctorService: DoctorService,
    adminService: AdminService,
  ) {
    super(
      organizationService,
      locationService,
      patientService,
      nurseService,
      doctorService,
      adminService,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER, Role.DOCTOR)
  public async getOrganizationPatients(@GetUser() user: UserRes) {
    return this.getOrganizationService().getOrganizationPatients(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/web-patients')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER, Role.DOCTOR)
  public async getOrganizationPatientsForWeb(
    @GetUser() user: UserRes,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.getOrganizationService().getOrganizationPatientsForWeb(
      user.id,
      +page,
      +limit,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/nurses')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async getOrganizationNurses(@GetUser() user: UserRes) {
    let branchId: any;
    if (user.role === Role.ADMIN || user.role === Role.DOCTOR) {
      branchId = await this.getAdminService().getBranchId(user.id);
    }
    const targetId =
      user.role === Role.SUPERADMIN ? user.organization_id : branchId.id;
    console.log('targetId', targetId);
    return this.getOrganizationService().getOrganizationNurses(
      targetId,
      user.role,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/doctors')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async getOrganizationDoctors(@GetUser() user: UserRes) {
    console.log('targetId=====>>>', user);
    let branchId: any;
    if (user.role === Role.ADMIN || user.role === Role.DOCTOR) {
      branchId = await this.getAdminService().getBranchId(user.id);
    }
    const targetId =
      user.role === Role.SUPERADMIN ? user.organization_id : branchId.id;
    console.log('targetId', targetId);
    return this.getOrganizationService().getOrganizationDoctors(
      targetId,
      user.role,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/users')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async getOrganizationUsers(
    @GetUser() user: UserRes,
    @Query('search') search: string,
    @Query('role') role: UserRole,
  ) {
    return this.getOrganizationService().getOrganizationUsers(
      user,
      search,
      role,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/branches/select')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async getOrganizationBranches(
    @GetUser() user: UserRes,
  ): Promise<SelectOrganizationBranchesProps[]> {
    return this.getOrganizationService().getOrganizationBranches(user);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/location/countries')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async getCountries(): Promise<CountriesProps[]> {
    return this.getLocationService().getCountries();
  }

  @HttpCode(HttpStatus.OK)
  @Get('/location/cities')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async getCities(): Promise<CitiesProps[]> {
    return this.getLocationService().getCities();
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/patient')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async createPatient(
    @Body() data: AddPatientDTO,
    @GetUser() user: UserRes,
  ) {
    const organizationId =
      await this.getOrganizationService().getOrganizationId(user.id);
    console.log('organizationId <<<<< >>>>> ', organizationId);

    const locationId = await this.getLocationService().createLocation(
      data.address,
      data.city_id,
    );

    const res = await this.getPatientService().addPatient(
      data,
      organizationId,
      locationId,
    );

    await this.getOrganizationService().sendOnBoardEmail({
      email: data.email,
      first_name: data.first_name,
      middle_name: data.middle_name,
      last_name: data.last_name,
      role: 'PATIENT',
      title: data.title,
      password: data.password,
    });

    return res;
  }

  @HttpCode(HttpStatus.OK)
  @Post('/patient/sync/:id')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER, Role.DOCTOR)
  public async triggerVivalinkSync(@Param('id') id: string) {
    return this.getPatientService().triggerVivalinkSync(id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/doctor')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async addDoctor(
    @GetUser() user: UserRes,
    @Body() data: AddDoctoreDTO,
  ): Promise<AddDoctorResult> {
    const organizationId =
      await this.getOrganizationService().getOrganizationId(user.id);

    const locationId = await this.getLocationService().createLocation(
      data.address,
      data.city_id,
    );

    const res = await this.getDoctorService().addDoctor(
      data,
      organizationId,
      locationId,
    );

    this.getOrganizationService().sendOnBoardEmail({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      middle_name: data.middle_name,
      role: 'DOCTOR',
      title: data.title,
      password: data.password,
    });

    return res;
  }

  @HttpCode(HttpStatus.OK)
  @Post('/doctor/sync/:id')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async triggerVivalinkSyncDoctor(@Param('id') id: string) {
    return this.getDoctorService().syncDoctor(id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/nurse')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async createNurse(
    @Body() data: AddNurseDTO,
    @GetUser() user: UserRes,
  ): Promise<boolean> {
    const organizationId =
      await this.getOrganizationService().getOrganizationId(user.id);

    const locationId = await this.getLocationService().createLocation(
      data.address,
      data.city_id,
    );

    const res = await this.getNurseService().addNurse(
      data,
      organizationId,
      locationId,
    );

    this.getOrganizationService().sendOnBoardEmail({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      middle_name: data.middle_name,
      role: 'NURSE',
      title: data.title,
      password: data.password,
    });

    return res;
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/superadmin')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.MASTER)
  public async addSuperadmin(@Body() data: AddSuperadminDTO): Promise<boolean> {
    const locationId = await this.getLocationService().createLocation(
      data.address,
      data.city_id,
    );

    await this.getAdminService().addSuperAdmin(data, locationId);

    this.getOrganizationService().sendOnBoardEmail({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      middle_name: data.middle_name,
      role: 'SUPERADMIN',
      title: data.title,
      password: data.password,
    });

    return true;
  }
  @HttpCode(HttpStatus.CREATED)
  @Post('/admin')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async addAdmin(
    @Body() data: AddAdminDTO,
    @GetUser() user: UserRes,
  ): Promise<boolean> {
    const organizationId =
      await this.getOrganizationService().getOrganizationId(user.id);

    const locationId = await this.getLocationService().createLocation(
      data.address,
      data.city_id,
    );

    const res = await this.getAdminService().addAdmin(
      data,
      locationId,
      organizationId,
    );

    this.getOrganizationService().sendOnBoardEmail({
      email: data.email,
      first_name: data.first_name,
      last_name: data.last_name,
      middle_name: data.middle_name,
      role: 'ADMIN',
      title: data.title,
      password: data.password,
    });

    return res;
  }

  @HttpCode(HttpStatus.OK)
  @Get('/departments/:branchId')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async getBranchDepartmet(
    @Param('branchId') branchId: string,
    @GetUser() user: UserRes,
  ): Promise<Array<SelectOrganizationDepartmentProps>> {
    return this.getOrganizationService().getOrganizationDepartments(
      branchId,
      user.id,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/disable-user')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.MASTER)
  public async disableUser(@Query('id') id: string) {
    if (!id) {
      throw new BadRequestException('User id is required');
    }
    return this.getOrganizationService().disableUser(id);
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/medicines')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN)
  public async createOrganizationMedicine(
    @Body() data: AddMedicinesDTO,
    @GetUser() user: UserRes,
  ) {
    const organizationId =
      await this.getOrganizationService().getOrganizationId(user.id);

    return this.getOrganizationService().addOrganizationMedicines(
      organizationId,
      data.names,
      user.id,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/add-medicine')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN)
  public async addOrganizationMedicine(
    @Body() data: AddMedicineDTO,
    @GetUser() user: UserRes,
  ) {
    const organizationId =
      await this.getOrganizationService().getOrganizationId(user.id);
    const branchId = await this.getAdminService().getBranchId(user.id);
    return this.getOrganizationService().addOrganizationMedicine(
      organizationId,
      branchId.id,
      data.name,
      user.id,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/medicine-superadmin')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN)
  public async addSuperAdminMedicine(
    @Body() data: AddSuperAdminMedicineDTO,
    @GetUser() user: UserRes,
  ) {
    const organizationId =
      await this.getOrganizationService().getOrganizationId(user.id);

    return this.getOrganizationService().addSuperAdminMedicine(
      organizationId,
      data.branch_id,
      data.name,
      user.id,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/medicines')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN)
  public async getOrganizationMedicine(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @GetUser() user: UserRes,
  ) {
    let branchId: any;
    if (user.role === Role.ADMIN) {
      branchId = await this.getAdminService().getBranchId(user.id);
    }
    const targetId =
      user.role === Role.SUPERADMIN ? user.organization_id : branchId.id;
    console.log('targetId', targetId);

    return this.getOrganizationService().getOrganizationMedicines(
      targetId,
      user.role,
      +page,
      +limit,
    );
  }

  @HttpCode(HttpStatus.CREATED)
  @Put('/update-medicine/:medicine_id')
  @UseGuards(RolesGuard)
  @RequirePermission(Role.SUPERADMIN, Role.ADMIN)
  public async updateOrganizationMedicine(
    @Param('medicine_id') medicineId: string,
    @Body('name') name: string,
  ) {
    return this.getOrganizationService().updateOrganizationMedicine(
      medicineId,
      name,
    );
  }
}
