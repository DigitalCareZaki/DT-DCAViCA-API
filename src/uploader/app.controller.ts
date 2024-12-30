import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { UploaderController } from './uploader.controller';
import { UploaderService } from './uploader.service';

import type { HealthRes } from '@types';

@Controller('app/uploader')
export class UploaderAppController extends UploaderController {
  constructor(uploaderService: UploaderService) {
    super(uploaderService);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/health')
  public health(): HealthRes {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }
}
