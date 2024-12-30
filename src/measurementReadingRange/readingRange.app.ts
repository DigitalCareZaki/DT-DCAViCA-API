import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { ReadingRangeController } from './readingRange.controller';
import { ReadingRangeService } from './readingRange.service';

import type { HealthRes } from '@types';

@Controller('app/measurements/ranges')
export class ReadingRangeAppController extends ReadingRangeController {
  constructor(readingRange: ReadingRangeService) {
    super(readingRange);
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
