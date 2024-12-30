import { Controller, UseGuards } from '@nestjs/common';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

import { ComplianceService } from './compliance.service';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.NURSE)
export class ComplianceController {
  constructor(private complianceService: ComplianceService) {}

  public getComplianceService(): ComplianceService {
    return this.complianceService;
  }
}
