import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { NurseController } from './nurse.controller';
import { NurseService } from './nurse.service';

import type { HealthRes } from '@types';

@Controller('app/nurse')
export class NurseAppController extends NurseController {
  constructor(nurseService: NurseService) {
    super(nurseService);
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
