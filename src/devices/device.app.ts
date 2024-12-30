import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';

import type { HealthRes } from '@types';

@Controller('app/devices')
export class DeviceAppController extends DeviceController {
  constructor(deviceService: DeviceService) {
    super(deviceService);
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
