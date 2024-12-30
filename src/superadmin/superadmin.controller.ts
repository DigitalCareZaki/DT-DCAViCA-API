import { Controller, UseGuards } from '@nestjs/common';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { SuperadminService } from './superadmin.service';
import { BranchService } from 'src/branch/branch.service';
import { LocationService } from 'src/location/location.service';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.SUPERADMIN)
export class SuperadminController {
  constructor(
    private superAdminService: SuperadminService,
    private branchService: BranchService,
    private locationService: LocationService,
  ) {}

  public getSuperAdminService(): SuperadminService {
    return this.superAdminService;
  }

  public getBranchService(): BranchService {
    return this.branchService;
  }

  public getLocationService(): LocationService {
    return this.locationService;
  }
}
