import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import type { HealthRes } from '@types';

@Controller('app/rag')
export class RagAppController {
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
