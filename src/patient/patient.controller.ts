import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { PatientService } from './patient.service';
import { GetUser } from 'src/auth/decorators';
import { UserRes } from '@types';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

import type { ProfileProps } from './types';

@Controller('patient')
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.PATIENT, Role.DOCTOR)
export class PatientController {
  constructor(private patientService: PatientService) { }

  @HttpCode(HttpStatus.OK)
  @Get('profile')
  public async current(@GetUser() user: UserRes): Promise<ProfileProps> {
    return this.getPatientService().profile(user.id);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('profile')
  public async updateProfile(
    @GetUser() user: UserRes,
    @Body() data: any,
  ): Promise<any> {
    return await this.patientService.updateProfle(user.id, data);
  }

  public getPatientService(): PatientService {
    return this.patientService;
  }
}
