import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards';
import { DepartmentsService } from './departments.service';
import { RequirePermission } from 'src/auth/decorators/role.decorator';
import { Role } from 'src/auth/enums/role.enum';

@Controller()
@UseGuards(JwtGuard)
@RequirePermission(Role.SUPERADMIN, Role.ADMIN)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  public getDepartmentService(): DepartmentsService {
    return this.departmentsService;
  }

  @Get('/healthz')
  public healthz(): string {
    return 'Department Routes';
  }
}
