import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { MedicationController } from './medication.controller';
import { MedicationService } from './medication.service';

import type { HealthRes } from '@types';

@Controller('app/medications')
export class MedicationAppController extends MedicationController {
  constructor(medicationService: MedicationService) {
    super(medicationService);
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
