import { Controller, Get, HttpCode, HttpStatus, UseGuards, Param, Query, Res } from '@nestjs/common';
import type { HealthRes, UserRes } from '@types';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { GetUser } from 'src/auth/decorators';
import { MedicationService } from './medication.service';
import { Response } from 'express';

@Controller('app/medications')
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
export class MedicationAppController {
  constructor(private readonly medicationService: MedicationService) { }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }

  @Get('/patients/:id')
  public async getPatientMedication(
    @GetUser() user: UserRes,
    @Param('id') id: string,
    @Query('search') search: string,

  ) {
    return this.medicationService.getPatientMedicationForApp(
      id,
      user.id,
      user.role,
      search || ''

    );
  }

  @Get('/check-pending')
  public async checkPatientCurrentMedication(@GetUser() user: UserRes, @Res() res: Response) {
    return this.medicationService.checkPatientCurrentMedication(user.id, res);
  }
}
