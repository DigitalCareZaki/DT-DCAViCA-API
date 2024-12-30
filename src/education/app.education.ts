import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { EducationController } from './education.controller';
import { EducationService } from './education.service';

import type { HealthRes } from '@types';

@Controller('app/education')
export class EducationAppController extends EducationController {
  constructor(educationService: EducationService) {
    super(educationService);
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
