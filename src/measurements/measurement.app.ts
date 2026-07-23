import { Controller, Get, HttpCode, HttpStatus, Query, UseGuards } from '@nestjs/common';
import type { HealthRes, UserRes } from '@types';
import { GetUser } from 'src/auth/decorators';
import { MeasurementService } from './measurement.service';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller('app/measurements')
export class MeasurementAppController {
  constructor(private readonly measurementService: MeasurementService) { }

  @HttpCode(HttpStatus.OK)
  @Get()
  public async health(): Promise<HealthRes> {
    return {
      status: 'running',
      availableRoutes: [],
    };
  }

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtGuard, RolesGuard)
  @RequirePermission(Role.DOCTOR, Role.NURSE)
  @Get('/rag')
  public async getRagForDoctor(@GetUser() user: UserRes, @Query('type') type?: string) {
    const data = await this.measurementService.getAppMeasurementsOfAllPatients(
      user.id,
      user.role,
      type || '',

    );

    let result;

    if (Array.isArray(data) && data.length > 0) {
      result = data.map((m) => {
        return {
          id: m.id,
          status: m.status,
          created_at: m.created_at,
          patient: `${m.patient.user.first_name} ${m.patient.user.last_name}`,
          type: m.type,
          // map first two values to value1 and value2
          ...(() => {
            const obj: Record<string, number> = {};
            if (m.values && m.values.length >= 1) {
              obj.value1 = m.values[0];
            }
            if (m.values && m.values.length >= 2) {
              obj.value2 = m.values[1];
            }
            return obj;
          })(),
          unit: m.unit,
        };
      });
    }

    return result || [];
  }
}
