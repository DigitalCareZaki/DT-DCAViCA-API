import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { ComplianceController } from './compliance.controller';
import { ComplianceService } from './compliance.service';

import type { HealthRes } from '@types';

@Controller('app/compliance')
export class ComplianceAppController extends ComplianceController {
  constructor(complianceService: ComplianceService) {
    super(complianceService);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }
}
