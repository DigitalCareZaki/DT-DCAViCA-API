import { Controller, UseGuards } from '@nestjs/common';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

import { DeviceService } from './device.service';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.DOCTOR, Role.NURSE, Role.PATIENT)
export class DeviceController {
  constructor(private deviceService: DeviceService) { }

  public getDeviceService(): DeviceService {
    return this.deviceService;
  }
}
