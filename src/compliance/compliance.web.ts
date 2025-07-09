import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
} from '@nestjs/common';

import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

import { GetUser } from 'src/auth/decorators';

import type { HealthRes, UserRes } from '@types';
import type { PatientCompliance, PatientCompliancePerPill } from './types';

@Controller('web/compliance')
export class ComplianceWebController extends ComplianceController {
  constructor(complianceService: ComplianceService) {
    super(complianceService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/health')
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async getAllPatientsCompliance(
    @GetUser() user: UserRes,
    @Query('type') type?: string,
  ): Promise<PatientCompliance> {
    return this.getComplianceService().getAllPatientsCompliance(
      user.id,
      user.role,
      type,
    );
  }

  @HttpCode(HttpStatus.OK)
  @Get('/patients/:id') // :id -> patient -> user_id
  public async getSinglePatientCompliance(
    @GetUser() user: UserRes,
    @Param('id') id: string,
  ): Promise<PatientCompliancePerPill> {

    return this.getComplianceService().getPatientCompliancePerPill(
      id,
      user.id,
      user.role,
    );
  }
}
