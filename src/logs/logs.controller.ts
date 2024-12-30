import { Controller, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { LogsService } from './logs.service';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller()
@UseGuards(JwtGuard)
@RequirePermission(Role.SUPERADMIN, Role.ADMIN, Role.DOCTOR, Role.MASTER)
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  public getLogsService(): LogsService {
    return this.logsService;
  }
}
