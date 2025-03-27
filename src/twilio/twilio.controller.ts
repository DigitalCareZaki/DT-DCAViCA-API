import { Controller, UseGuards } from '@nestjs/common';

import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { TwilioService } from './twilio.service';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.DOCTOR)
export class TwilioController {
  constructor(private twilioService: TwilioService) { }

  public getTwilioService(): TwilioService {
    return this.twilioService;
  }
}
