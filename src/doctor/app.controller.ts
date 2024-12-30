import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { DoctorController } from './doctor.controller';
import { DoctorService } from './doctor.service';

import type { HealthRes } from '@types';

@Controller('app/doctor')
export class DoctorAppController extends DoctorController {
  constructor(doctorService: DoctorService) {
    super(doctorService);
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
