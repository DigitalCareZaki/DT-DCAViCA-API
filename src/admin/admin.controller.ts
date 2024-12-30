import { Controller, UseGuards } from '@nestjs/common';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { AdminService } from './admin.service';
import { Role } from 'src/auth/enums/role.enum';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  public getAdminService(): AdminService {
    return this.adminService;
  }
}
