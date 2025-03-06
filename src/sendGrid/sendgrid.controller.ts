import { Controller, UseGuards } from '@nestjs/common';

import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { SendgridService } from './sendgrid.service';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.DOCTOR)
export class SendgridController {
  constructor(private sendGridService: SendgridService) {}

  public getSendGridService(): SendgridService {
    return this.sendGridService;
  }
}
