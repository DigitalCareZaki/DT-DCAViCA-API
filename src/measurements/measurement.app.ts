import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { MeasurementController } from './measurement.controller';
import { MeasurementService } from './measurement.service';

import type { HealthRes } from '@types';

@Controller('app/measurements')
export class MeasurementAppController extends MeasurementController {
  constructor(measurementService: MeasurementService) {
    super(measurementService);
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
