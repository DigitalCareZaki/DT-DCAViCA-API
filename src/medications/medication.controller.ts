import { Controller, UseGuards } from '@nestjs/common';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

import { MedicationService } from './medication.service';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
export class MedicationController {
  constructor(private medicationService: MedicationService) {}

  public getMedicationService(): MedicationService {
    return this.medicationService;
  }
}
