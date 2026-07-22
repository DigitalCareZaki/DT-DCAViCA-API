import { Controller, Get, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import type { HealthRes, UserRes } from '@types';
import { GetUser } from 'src/auth/decorators';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { RagService } from './rag.service';

@Controller('app/rag')
export class RagAppController {
  constructor(private readonly ragService: RagService) { }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @RequirePermission(Role.PATIENT)
  @HttpCode(HttpStatus.OK)
  @Get('/measurement-analytic')
  public async getMeasurementsAnalyticWithLatestReadings(@GetUser() user: UserRes) {
    const analytic = await this.ragService.getMeasurementsCountByPatientId(user.id);
    const latestReadings = await this.ragService.getPatientLatestReadings(user.id);

    return { analytic, latestReadings };
  }

  @UseGuards(JwtGuard, RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE,)
  @HttpCode(HttpStatus.OK)
  @Get('/analytic')
  public async getMeasurementsAnalyticForDoctor(@GetUser() user: UserRes) {
    const analytic = await this.ragService.getMeasurementsCountByDoctorId(user);
    const latestReadings = await this.ragService.getPatientLatestReadingsForDoctor(user);

    return { analytic, latestReadings };
  }
}
