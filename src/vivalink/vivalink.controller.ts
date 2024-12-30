import {
  Controller,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
  Param,
} from '@nestjs/common';

import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { VivalinkService } from './vivalink.service';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';

import type { VLAllPatients, VLSinglePatientECGData } from './types';

@Controller('vl')
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR)
export class VivalinkController {
  constructor(private vivalinkService: VivalinkService) {}

  @HttpCode(HttpStatus.OK)
  @Get('patients')
  public async getPatients(): Promise<VLAllPatients> {
    return this.vivalinkService.getPatients();
  }

  @HttpCode(HttpStatus.OK)
  @Get('patients/:patchSn')
  public async getPatientData(
    @Param('patchSn') patchSn: string,
  ): Promise<VLSinglePatientECGData> {
    return this.vivalinkService.getPatientData(patchSn);
  }

  public getVivalinkService(): VivalinkService {
    return this.vivalinkService;
  }
}
