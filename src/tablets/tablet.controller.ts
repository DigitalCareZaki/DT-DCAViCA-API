import { Controller, UseGuards } from '@nestjs/common';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

import { TabletService } from './tablet.service';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.DOCTOR, Role.NURSE)
export class TabletController {
  constructor(private tabletService: TabletService) {}

  public getTabletService(): TabletService {
    return this.tabletService;
  }
}
