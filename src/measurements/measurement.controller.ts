import { Controller, UseGuards } from '@nestjs/common';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

import { MeasurementService } from './measurement.service';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
export class MeasurementController {
  constructor(private measurementService: MeasurementService) {}

  public getMeasurementService(): MeasurementService {
    return this.measurementService;
  }
}
