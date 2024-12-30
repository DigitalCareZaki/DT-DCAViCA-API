import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';

import { RagController } from './rag.controller';
import { RagService } from './rag.service';

import type { HealthRes } from '@types';

@Controller('app/rag')
export class RagAppController extends RagController {
  constructor(ragService: RagService) {
    super(ragService);
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
