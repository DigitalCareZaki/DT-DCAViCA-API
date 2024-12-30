import { Controller, UseGuards } from '@nestjs/common';
import { MasterService } from './master.service';
import { JwtGuard } from 'src/auth/guards';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller()
@UseGuards(JwtGuard)
@RequirePermission(Role.MASTER)
export class MasterController {
  constructor(private readonly masterService: MasterService) {}

  public getMasterService(): MasterService {
    return this.masterService;
  }
}
