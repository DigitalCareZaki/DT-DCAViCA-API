import { Controller, UseGuards } from '@nestjs/common';

import { JwtGuard, RolesGuard } from 'src/auth/guards';
import { Role } from 'src/auth/enums/role.enum';
import { RequirePermission } from 'src/auth/decorators/role.decorator';

import { RagService } from './rag.service';

@Controller()
@UseGuards(JwtGuard, RolesGuard)
@RequirePermission(Role.DOCTOR, Role.NURSE, Role.PATIENT)
export class RagController {
  constructor(private ragService: RagService) {}

  public getRagService(): RagService {
    return this.ragService;
  }
}
