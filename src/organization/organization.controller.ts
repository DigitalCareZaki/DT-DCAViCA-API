import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';

import { JwtGuard } from 'src/auth/guards';
import { OrganizationService } from './organization.service';
import { GetUser } from 'src/auth/decorators';

import type { CurrentOrganization } from './types';
import type { UserRes } from '@types';
import { LocationService } from 'src/location/location.service';
import { PatientService } from 'src/patient/patient.service';
import { NurseService } from 'src/nurse/nurse.service';
import { DoctorService } from 'src/doctor/doctor.service';
import { AdminService } from 'src/admin/admin.service';

@Controller()
@UseGuards(JwtGuard)
export class OrganizationController {
  constructor(
    private organizationService: OrganizationService,
    private locationService: LocationService,
    private patientService: PatientService,
    private nurseService: NurseService,
    private doctorService: DoctorService,
    private adminService: AdminService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get('/')
  public async organization(
    @GetUser() user: UserRes,
  ): Promise<CurrentOrganization> {
    return this.organizationService.getOrganization(user.id);
  }

  public getOrganizationService(): OrganizationService {
    return this.organizationService;
  }

  public getLocationService(): LocationService {
    return this.locationService;
  }

  public getPatientService(): PatientService {
    return this.patientService;
  }

  public getNurseService(): NurseService {
    return this.nurseService;
  }

  public getDoctorService(): DoctorService {
    return this.doctorService;
  }

  public getAdminService(): AdminService {
    return this.adminService;
  }
}
