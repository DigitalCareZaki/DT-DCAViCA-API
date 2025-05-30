import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import type { HealthRes } from '@types';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtGuard, RolesGuard } from 'src/auth/guards';

@Controller('app/medications')
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
export class MedicationAppController {
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
