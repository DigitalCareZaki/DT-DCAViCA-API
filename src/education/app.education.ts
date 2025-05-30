import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import type { HealthRes } from '@types';
import { JwtGuard } from 'src/auth/guards';

@Controller('app/education')
@UseGuards(JwtGuard)
export class EducationAppController {
  

  @HttpCode(HttpStatus.OK)
  @Get()
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }
}
