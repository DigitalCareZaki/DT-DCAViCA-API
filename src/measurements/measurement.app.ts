import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import type { HealthRes } from '@types';

@Controller('app/measurements')
export class MeasurementAppController {
  constructor() { }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }
}
